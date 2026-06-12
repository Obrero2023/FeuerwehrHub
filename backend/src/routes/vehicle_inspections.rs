use axum::{
    extract::{Path, State},
    middleware,
    routing::{delete, get, post, put},
    Extension, Json, Router,
};
use chrono::{NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    auth::middleware::{require_auth, Claims},
    errors::{AppError, AppResult},
    AppState,
};

// ── Structs ───────────────────────────────────────────────────────────────────

#[derive(Serialize, sqlx::FromRow)]
pub struct InspectionTemplate {
    pub id:            Uuid,
    pub vehicle_type:  String,
    pub item_name:     String,
    pub description:   Option<String>,
    pub priority:      String,
    pub display_order: i32,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct Inspection {
    pub id:               Uuid,
    pub vehicle_id:      Uuid,
    pub inspection_date: NaiveDate,
    pub inspected_by:    Option<Uuid>,
    pub inspected_by_name: Option<String>,
    pub completed_at:    Option<String>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct InspectionItem {
    pub id:            Uuid,
    pub inspection_id: Uuid,
    pub template_id:   Option<Uuid>,
    pub item_name:     String,
    pub status:        String,
    pub comment:       Option<String>,
}

#[derive(Deserialize)]
pub struct CreateInspectionRequest {
    pub vehicle_id: Uuid,
    pub inspection_date: NaiveDate,
}

#[derive(Deserialize)]
pub struct InspectionItemUpdate {
    pub status: String,
    pub comment: Option<String>,
}

#[derive(Deserialize)]
pub struct SaveInspectionRequest {
    pub items: Vec<InspectionItemData>,
}

#[derive(Deserialize)]
pub struct InspectionItemData {
    pub id: Option<Uuid>,
    pub item_name: String,
    pub status: String,
    pub comment: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateInspectionTemplateRequest {
    pub vehicle_type: String,
    pub item_name: String,
    pub description: Option<String>,
    pub priority: String,
    pub display_order: i32,
}

// ── Routen ─────────────────────────────────────────────────────────────────────

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/templates/:vehicle_type", get(get_templates))
        .route("/templates", post(create_template))
        .route("/", post(create_inspection))
        .route("/:inspection_id", get(get_inspection))
        .route("/:inspection_id/items", get(get_inspection_items))
        .route("/:inspection_id/save", post(save_inspection))
        .layer(middleware::from_fn_with_state(
            AppState::default(),
            require_auth,
        ))
}

// ── Handler ────────────────────────────────────────────────────────────────────

async fn get_templates(
    State(state): State<AppState>,
    Path(vehicle_type): Path<String>,
) -> AppResult<Json<Vec<InspectionTemplate>>> {
    let templates = sqlx::query_as::<_, InspectionTemplate>(
        "SELECT id, vehicle_type, item_name, description, priority, display_order 
         FROM vehicle_inspection_templates 
         WHERE vehicle_type = $1 
         ORDER BY display_order"
    )
    .bind(&vehicle_type)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(templates))
}

async fn create_template(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(req): Json<CreateInspectionTemplateRequest>,
) -> AppResult<Json<InspectionTemplate>> {
    let template = sqlx::query_as::<_, InspectionTemplate>(
        "INSERT INTO vehicle_inspection_templates (vehicle_type, item_name, description, priority, display_order) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (vehicle_type, item_name) DO UPDATE 
           SET description = EXCLUDED.description, priority = EXCLUDED.priority, display_order = EXCLUDED.display_order 
         RETURNING id, vehicle_type, item_name, description, priority, display_order"
    )
    .bind(&req.vehicle_type)
    .bind(&req.item_name)
    .bind(&req.description)
    .bind(&req.priority)
    .bind(req.display_order)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(template))
}

async fn create_inspection(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(req): Json<CreateInspectionRequest>,
) -> AppResult<Json<Inspection>> {
    let inspection = sqlx::query_as::<_, Inspection>(
        "INSERT INTO vehicle_inspections (vehicle_id, inspection_date, inspected_by, inspected_by_name) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, vehicle_id, inspection_date, inspected_by, inspected_by_name, completed_at"
    )
    .bind(req.vehicle_id)
    .bind(req.inspection_date)
    .bind(claims.user_id)
    .bind(&claims.username)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(inspection))
}

async fn get_inspection(
    State(state): State<AppState>,
    Path(inspection_id): Path<Uuid>,
) -> AppResult<Json<Inspection>> {
    let inspection = sqlx::query_as::<_, Inspection>(
        "SELECT id, vehicle_id, inspection_date, inspected_by, inspected_by_name, completed_at 
         FROM vehicle_inspections 
         WHERE id = $1"
    )
    .bind(inspection_id)
    .fetch_one(&state.db)
    .await
    .map_err(|_| AppError::NotFound)?;

    Ok(Json(inspection))
}

async fn get_inspection_items(
    State(state): State<AppState>,
    Path(inspection_id): Path<Uuid>,
) -> AppResult<Json<Vec<InspectionItem>>> {
    let items = sqlx::query_as::<_, InspectionItem>(
        "SELECT id, inspection_id, template_id, item_name, status, comment 
         FROM vehicle_inspection_items 
         WHERE inspection_id = $1 
         ORDER BY created_at"
    )
    .bind(inspection_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(items))
}

async fn save_inspection(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(inspection_id): Path<Uuid>,
    Json(req): Json<SaveInspectionRequest>,
) -> AppResult<Json<serde_json::Value>> {
    let mut tx = state.db.begin().await?;

    for item in req.items {
        if let Some(item_id) = item.id {
            sqlx::query(
                "UPDATE vehicle_inspection_items SET status = $1, comment = $2, updated_at = NOW() 
                 WHERE id = $3"
            )
            .bind(&item.status)
            .bind(&item.comment)
            .bind(item_id)
            .execute(&mut *tx)
            .await?;
        } else {
            sqlx::query(
                "INSERT INTO vehicle_inspection_items (inspection_id, item_name, status, comment) 
                 VALUES ($1, $2, $3, $4)"
            )
            .bind(inspection_id)
            .bind(&item.item_name)
            .bind(&item.status)
            .bind(&item.comment)
            .execute(&mut *tx)
            .await?;
        }
    }

    // Mark inspection as completed
    sqlx::query(
        "UPDATE vehicle_inspections SET completed_at = NOW() WHERE id = $1"
    )
    .bind(inspection_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Prüfung gespeichert"
    })))
}
