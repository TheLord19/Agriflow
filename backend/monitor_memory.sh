#!/bin/bash

# Configuration
THRESHOLD=1000 # Threshold in MB (If available RAM < 1000MB, take action)
LOG_FILE="/root/telangana/2_Soham_Block_Chain/supply-chain-demo/backend/memory_monitor.log"

echo "Starting Memory Monitor... (Threshold: ${THRESHOLD}MB)"

while true; do
    # Get available memory in MB (Column 7 is 'available' on modern Linux 'free')
    # If your 'free' is older, column 4 might be 'free' (unused), but 'available' is better.
    # We use awk to grab the value under 'available'.
    AVAILABLE=$(free -m | awk '/^Mem:/{print $7}')
    
    # Fallback if column 7 is empty (older systems)
    if [ -z "$AVAILABLE" ]; then
        AVAILABLE=$(free -m | awk '/^Mem:/{print $4}')
    fi

    if [ "$AVAILABLE" -lt "$THRESHOLD" ]; then
        echo "$(date): [WARNING] Low Memory Detected: ${AVAILABLE}MB available. Action: Clearing Caches..." >> "$LOG_FILE"
        
        # 1. Clear PageCache, dentries, and inodes.
        # This is safe; it just frees up cached data that can be re-read from disk.
        sync; echo 3 > /proc/sys/vm/drop_caches
        
        # Re-check
        AVAILABLE_AFTER=$(free -m | awk '/^Mem:/{print $7}')
        if [ -z "$AVAILABLE_AFTER" ]; then AVAILABLE_AFTER=$(free -m | awk '/^Mem:/{print $4}'); fi
        
        echo "$(date): [INFO] Memory released. Now available: ${AVAILABLE_AFTER}MB" >> "$LOG_FILE"
        
        # OPTIONAL: If memory is STILL critically low (< 200MB), we might need to restart services.
        # Uncomment below if you want aggressive restarting.
        # if [ "$AVAILABLE_AFTER" -lt 200 ]; then
        #    echo "$(date): [CRITICAL] Memory still critical. Restarting Backend..." >> "$LOG_FILE"
        #    # Add command to restart backend here, e.g., systemctl restart agriflow-backend
        # fi
    fi
    
    sleep 10
done
