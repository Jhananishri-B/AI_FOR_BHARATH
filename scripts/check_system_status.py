#!/usr/bin/env python3
"""
System Status Checker - Identifies what's working and what's not
"""

import requests
import subprocess
import sys
import os

def check_service(url, name):
    """Check if a service is running"""
    try:
        response = requests.get(url, timeout=2)
        return {
            "status": "running",
            "response": response.status_code,
            "error": None
        }
    except requests.exceptions.ConnectionError:
        return {
            "status": "not running",
            "response": None,
            "error": "Connection refused"
        }
    except Exception as e:
        return {
            "status": "error",
            "response": None,
            "error": str(e)
        }

def check_mongodb():
    """Check MongoDB connection"""
    try:
        from pymongo import MongoClient
        client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
        client.server_info()
        client.close()
        return {"status": "connected", "error": None}
    except Exception as e:
        return {"status": "disconnected", "error": str(e)}

def main():
    print("=" * 60)
    print("LearnQuest System Status Check")
    print("=" * 60)
    
    results = {}
    
    # Check API
    print("\n1. Checking API Server (http://localhost:8000)")
    api_status = check_service("http://localhost:8000/api/health", "API")
    results['api'] = api_status
    if api_status["status"] == "running":
        print(f"   ✅ API is running (status: {api_status['response']})")
    else:
        print(f"   ❌ API is not running")
        print(f"      Error: {api_status['error']}")
    
    # Check Web Frontend
    print("\n2. Checking Web Frontend (http://localhost:5173)")
    web_status = check_service("http://localhost:5173", "Web Frontend")
    results['web'] = web_status
    if web_status["status"] == "running":
        print(f"   ✅ Web Frontend is running (status: {web_status['response']})")
    else:
        print(f"   ❌ Web Frontend is not running")
        print(f"      Error: {web_status['error']}")
    
    # Check Admin Frontend
    print("\n3. Checking Admin Frontend (http://localhost:5174)")
    admin_status = check_service("http://localhost:5174", "Admin Frontend")
    results['admin'] = admin_status
    if admin_status["status"] == "running":
        print(f"   ✅ Admin Frontend is running (status: {admin_status['response']})")
    else:
        print(f"   ❌ Admin Frontend is not running")
        print(f"      Error: {admin_status['error']}")
    
    # Check MongoDB
    print("\n4. Checking MongoDB (localhost:27017)")
    mongo_status = check_mongodb()
    results['mongodb'] = mongo_status
    if mongo_status["status"] == "connected":
        print(f"   ✅ MongoDB is connected")
    else:
        print(f"   ❌ MongoDB is not connected")
        print(f"      Error: {mongo_status['error']}")
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    all_working = all([
        results['api']['status'] == 'running',
        results['web']['status'] == 'running',
        results['admin']['status'] == 'running',
        results['mongodb']['status'] == 'connected'
    ])
    
    if all_working:
        print("\n✅ All services are running!")
    else:
        print("\n⚠️  Some services are not running:")
        
        if results['api']['status'] != 'running':
            print("\n❌ API Server:")
            print("   Solution: cd services/api && uvicorn src.main:app --reload --port 8000")
        
        if results['web']['status'] != 'running':
            print("\n❌ Web Frontend:")
            print("   Solution: cd apps/web-frontend && npm run dev")
        
        if results['admin']['status'] != 'running':
            print("\n❌ Admin Frontend:")
            print("   Solution: cd apps/admin-frontend && npm run dev")
        
        if results['mongodb']['status'] != 'connected':
            print("\n❌ MongoDB:")
            print("   Solution: Start MongoDB or use docker-compose up db")
    
    print("\n" + "=" * 60)
    
    return 0 if all_working else 1

if __name__ == "__main__":
    sys.exit(main())

