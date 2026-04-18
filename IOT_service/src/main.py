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

####### check thisssss
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows React to fetch data
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)