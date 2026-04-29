from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models, database, routes

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="ASU Admin Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router)

@app.get("/")
def root():
    return {"status": "Admin Service is running"}