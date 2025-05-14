
from fastapi import Depends, HTTPException, status
from typing import Annotated, List

from .. import app, db_pool
from ..models import Alert, AlertCreate, AlertUpdate
from ..auth import get_current_active_user, check_admin_role

@app.get("/alerts", response_model=List[Alert])
async def get_alerts(current_user: Annotated[dict, Depends(get_current_active_user)]):
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM alerts ORDER BY created_at DESC")
        return [dict(row) for row in rows]

@app.post("/alerts", response_model=Alert, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert: AlertCreate, 
    current_user: Annotated[dict, Depends(check_admin_role)]
):
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO alerts (name, description, severity, query, is_active, created_by) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *
            """, 
            alert.name, alert.description, alert.severity, alert.query, alert.is_active, current_user["id"]
        )
        return dict(row)

@app.get("/alerts/{alert_id}", response_model=Alert)
async def get_alert(
    alert_id: int,
    current_user: Annotated[dict, Depends(get_current_active_user)]
):
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM alerts WHERE id = $1", alert_id)
        if not row:
            raise HTTPException(status_code=404, detail="Alert not found")
        return dict(row)

@app.patch("/alerts/{alert_id}", response_model=Alert)
async def update_alert(
    alert_id: int, 
    alert_update: AlertUpdate, 
    current_user: Annotated[dict, Depends(check_admin_role)]
):
    # Build dynamic update query based on provided fields
    set_parts = []
    params = [alert_id]
    param_idx = 2
    
    for field, value in alert_update.dict(exclude_unset=True).items():
        set_parts.append(f"{field} = ${param_idx}")
        params.append(value)
        param_idx += 1
        
    if not set_parts:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    query = f"UPDATE alerts SET {', '.join(set_parts)} WHERE id = $1 RETURNING *"
    
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(query, *params)
        if not row:
            raise HTTPException(status_code=404, detail="Alert not found")
        return dict(row)

@app.delete("/alerts/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: int, 
    current_user: Annotated[dict, Depends(check_admin_role)]
):
    async with db_pool.acquire() as conn:
        result = await conn.execute("DELETE FROM alerts WHERE id = $1", alert_id)
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Alert not found")
