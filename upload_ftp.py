import os
from ftplib import FTP
from dotenv import load_dotenv

if __name__ == '__main__':
    # Load environment variables from .env file
    load_dotenv()

    host = os.environ.get('FTP_HOST')
    user = os.environ.get('FTP_USER')
    passwd = os.environ.get('FTP_PASS')
    remote_dir = '/public_html/www.damebo.info'
    local_file = 'index.html'

    if not all([host, user, passwd]):
        print("Error: FTP credentials not found in .env file.")
        exit(1)
    
    print(f"Connecting to {host}...")
    try:
        ftp = FTP(host)
        ftp.login(user, passwd)
        ftp.encoding = 'utf-8'
        
        ftp.cwd(remote_dir)
        print(f"Uploading {local_file} to {remote_dir}")
        
        with open(local_file, 'rb') as f:
            ftp.storbinary(f"STOR {local_file}", f)
            
        ftp.quit()
        print("Upload complete!")
    except Exception as e:
        print(f"FTP error: {e}")
