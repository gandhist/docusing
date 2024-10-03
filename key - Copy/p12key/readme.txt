Gandhist@IT-DEV MINGW64 /c/projects/docusign/key/p12key
$ openssl req -new -key private.key -out cert.csr
Could not open file or uri for loading private key from private.key: No such file or directory

Gandhist@IT-DEV MINGW64 /c/projects/docusign/key/p12key
$ openssl gersa -out privateKey.key 2048
Invalid command 'gersa'; type "help" for a list.

Gandhist@IT-DEV MINGW64 /c/projects/docusign/key/p12key
$ openssl genrsa -out privateKey.key 2048

Gandhist@IT-DEV MINGW64 /c/projects/docusign/key/p12key
$ openssl req -new -key privateKey.key -out certificate.csr
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:ID
State or Province Name (full name) [Some-State]:Jakarta Utara
Locality Name (eg, city) []:Jakarta
Organization Name (eg, company) [Internet Widgits Pty Ltd]:P3SM
Organizational Unit Name (eg, section) []:IT Development
Common Name (e.g. server FQDN or YOUR name) []:DocuSign
Email Address []:docusign@p3sm.co.id

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:Qw3rty13
An optional company name []:P3SM

Gandhist@IT-DEV MINGW64 /c/projects/docusign/key/p12key
$ openssl x509 -req -in certificate.csr -signkey privateKey.key -out certificate.crt
Certificate request self-signature ok
subject=C=ID, ST=Jakarta Utara, L=Jakarta, O=P3SM, OU=IT Development, CN=DocuSign, emailAddress=docusign@p3sm.co.id

Gandhist@IT-DEV MINGW64 /c/projects/docusign/key/p12key
$ openssl pkcs12 -export -inkey privateKey.key -in certificate.crt -out certificate.p12 -passout pass:Qw3rty13

Gandhist@IT-DEV MINGW64 /c/projects/docusign/key/p12key
