#!/usr/bin/env python3
"""
Check GPU support for Learn Quest AI Tutor.
This script verifies that CUDA and GPU acceleration are available.
"""

import subprocess
import sys
import os

def check_nvidia_driver():
    """Check if NVIDIA driver is installed"""
    try:
        result = subprocess.run(['nvidia-smi'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ NVIDIA driver is installed")
            print("GPU Information:")
            print(result.stdout)
            return True
        else:
            print("❌ NVIDIA driver not found")
            return False
    except FileNotFoundError:
        print("❌ nvidia-smi not found - NVIDIA driver not installed")
        return False

def check_docker_gpu_support():
    """Check if Docker has GPU support"""
    try:
        result = subprocess.run(['docker', 'run', '--rm', '--gpus', 'all', 'nvidia/cuda:11.8-base-ubuntu22.04', 'nvidia-smi'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Docker GPU support is working")
            return True
        else:
            print("❌ Docker GPU support not working")
            print("Error:", result.stderr)
            return False
    except Exception as e:
        print(f"❌ Docker GPU test failed: {e}")
        return False

def check_pytorch_cuda():
    """Check if PyTorch can access CUDA"""
    try:
        import torch
        if torch.cuda.is_available():
            print(f"✅ PyTorch CUDA support is available")
            print(f"CUDA version: {torch.version.cuda}")
            print(f"Number of GPUs: {torch.cuda.device_count()}")
            for i in range(torch.cuda.device_count()):
                print(f"GPU {i}: {torch.cuda.get_device_name(i)}")
            return True
        else:
            print("❌ PyTorch CUDA support not available")
            return False
    except ImportError:
        print("❌ PyTorch not installed")
        return False

def main():
    print("🔍 Checking GPU support for Learn Quest AI Tutor...")
    print("=" * 60)
    
    # Check NVIDIA driver
    driver_ok = check_nvidia_driver()
    print()
    
    # Check Docker GPU support
    docker_ok = check_docker_gpu_support()
    print()
    
    # Check PyTorch CUDA
    pytorch_ok = check_pytorch_cuda()
    print()
    
    print("=" * 60)
    if driver_ok and docker_ok and pytorch_ok:
        print("🎉 All GPU checks passed! Your RTX 4050 will be used for AI acceleration.")
    else:
        print("⚠️  Some GPU checks failed. The system will fall back to CPU.")
        print("\nTo enable GPU support:")
        print("1. Install NVIDIA drivers: https://www.nvidia.com/drivers/")
        print("2. Install Docker with GPU support: https://docs.docker.com/config/containers/resource_constraints/#gpu")
        print("3. Install nvidia-docker2: https://github.com/NVIDIA/nvidia-docker")

if __name__ == "__main__":
    main()
