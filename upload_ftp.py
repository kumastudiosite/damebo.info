import os
import sys
from ftplib import FTP
from dotenv import load_dotenv

def upload_dir_recursive(ftp, local_dir, remote_dir):
    try:
        ftp.mkd(remote_dir)
        print(f"Created remote directory: {remote_dir}")
    except Exception:
        pass

    ftp.cwd(remote_dir)

    for item in os.listdir(local_dir):
        if item.startswith('.') or item == '__pycache__':
            continue
        local_path = os.path.join(local_dir, item)
        if os.path.isdir(local_path):
            upload_dir_recursive(ftp, local_path, remote_dir + '/' + item)
            ftp.cwd(remote_dir)
        else:
            print(f"Uploading: {local_path} -> {remote_dir}/{item}")
            with open(local_path, 'rb') as f:
                ftp.storbinary(f"STOR {item}", f)

if __name__ == '__main__':
    # Load environment variables from .env file
    load_dotenv()

    host = os.environ.get('FTP_HOST')
    user = os.environ.get('FTP_USER')
    passwd = os.environ.get('FTP_PASS')
    remote_base = '/public_html/www.damebo.info'
    
    # Determine what to upload (file or directory)
    local_target = sys.argv[1] if len(sys.argv) > 1 else 'index.html'

    if not os.path.exists(local_target):
        print(f"Error: Local path '{local_target}' does not exist.")
        exit(1)

    if not all([host, user, passwd]):
        print("Error: FTP credentials not found in .env file.")
        exit(1)
    
    print(f"Connecting to {host}...")
    try:
        ftp = FTP(host)
        ftp.login(user, passwd)
        ftp.encoding = 'utf-8'
        
        if os.path.isdir(local_target):
            remote_target = remote_base + '/' + local_target
            print(f"Starting recursive upload of directory '{local_target}' to '{remote_target}'...")
            upload_dir_recursive(ftp, local_target, remote_target)
        else:
            print(f"Uploading file '{local_target}' to '{remote_base}'")
            ftp.cwd(remote_base)
            with open(local_target, 'rb') as f:
                ftp.storbinary(f"STOR {os.path.basename(local_target)}", f)
            
        ftp.quit()
        print("Upload complete!")
    except Exception as e:
        print(f"FTP error: {e}")
