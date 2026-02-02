import socket
import os
import subprocess
import sys

# Default Desired Ports
PORTS = {
    "NGINX_PORT": 80,
    "PGADMIN_PORT": 5050,
    "DB_PORT": 5432,
    "BACKEND_PORT": 4001,
    "FRONTEND_PORT": 5173
}

def is_port_free(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) != 0

def find_free_port(start_port):
    port = start_port
    while port < 65535:
        if is_port_free(port):
            return port
        print(f"[-] Port {port} is busy. Trying {port+1}...")
        port += 1
    raise Exception("No free ports found!")

def main():
    print("------- SMART DOCKER LAUNCHER -------")
    
    # 1. Stop existing containers to free up ports if possible
    print("[*] Stopping any running containers...")
    subprocess.run(["docker-compose", "down"], stderr=subprocess.DEVNULL)

    # 2. Find Ports
    env_content = ""
    print("\n[*] Resolving Ports:")
    for name, default in PORTS.items():
        free_port = find_free_port(default)
        print(f"    [+] {name}: {free_port}")
        env_content += f"{name}={free_port}\n"

    # 3. Write .env file
    with open(".env", "w") as f:
        f.write(env_content)
    print("\n[*] Saved config to .env")

    # 4. Launch Docker
    print("[*] Starting Docker Stack with Smart Ports...")
    print("---------------------------------------------")
    try:
        subprocess.run(["docker-compose", "up", "--build", "-d"], check=True)
        print("\n[SUCCESS] System is Running!")
        
        # Parse Host Port for Nginx
        with open(".env") as f:
            for line in f:
                if "NGINX_PORT" in line:
                    port = line.split("=")[1].strip()
                    print(f"\n>>> ACCESS HERE: http://localhost:{port}")
                    print(f">>> PgAdmin:     http://localhost:{port}/pgadmin4")
                    
    except KeyboardInterrupt:
        print("\n[!] Stopping...")
        subprocess.run(["docker-compose", "down"])

if __name__ == "__main__":
    main()
