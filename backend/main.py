import uvicorn
import os
if __name__ == "__main__":
    port = os.getenv("PORT",8000)
    uvicorn.run("main-server:app", host="127.0.0.1", port=port, reload=True)
