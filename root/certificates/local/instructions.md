* Run this command from command-line:


```
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost\'
  -keyout localhost-privkey.pem -out localhost-cert.pem
```

Take both files (cert and key) and put them on root/certificates/local folder