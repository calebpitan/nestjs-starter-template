mkdir .keychain
ssh-keygen -t rsa -b 2048 -m PEM -f .keychain/jwtRS256.key
# Don't add passphrase
openssl rsa -in .keychain/jwtRS256.key -pubout -outform PEM -out .keychain/jwtRS256.key.pub
# cat .keychain/jwtRS256.key | base64 > .keychain/jwtRS256.key.base64
# cat .keychain/jwtRS256.key.pub | base64 > .keychain/jwtRS256.key.pub.base64
# cat .keychain/jwtRS256.key
# cat .keychain/jwtRS256.key.pub
