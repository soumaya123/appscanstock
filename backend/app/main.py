from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn
import os
from dotenv import load_dotenv

from app.database import engine, Base
from app.routers import auth, products, stock_entries, stock_exits, reports

# Charger les variables d'environnement
load_dotenv()

# Créer les tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Stock Management API",
    description="API pour la gestion de stock avec entrées/sorties, codes-barres et impression",
    version="1.0.0"
)

# Configuration CORS
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8081,http://192.168.100.156:3000"
)
origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]
# Autoriser aussi l'origine 'null' utilisée par le contexte file:// d'Electron
if 'null' not in origins:
    origins.append('null')

# En mode développement, permettre tous les origins
if os.getenv("ENVIRONMENT", "development") == "development":
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de sécurité
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# Enregistrement des routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(stock_entries.router, prefix="/api/stock-entries", tags=["Stock Entries"])
app.include_router(stock_exits.router, prefix="/api/stock-exits", tags=["Stock Exits"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

@app.get("/")
async def root():
    return {"message": "Stock Management API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
