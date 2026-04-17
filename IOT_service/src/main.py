from fastapi import FastAPI
from . import models, database, routes

# Create database tables automatically
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="ASU IoT Ingestion API")

# Register the endpoints
app.include_router(routes.router)

@app.get("/")
def health_check():
    return {"status": "IoT Ingestion Service is running"}