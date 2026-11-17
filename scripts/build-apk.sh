#!/usr/bin/env bash
# Build the SLP Billing Android APK without Gradle:
#   aapt2 (resources) -> javac (code) -> d8 (dex) -> zipalign -> apksigner
#
# Requirements (all portable, no root): JDK 21 and Android build-tools 34 +
# android-33 platform under /home/z/my-project/.toolchain/.
#
# Output: build/slp-billing.apk (then copied to public/ + download/ by the caller).
set -euo pipefail

ROOT=/home/z/my-project
APP=$ROOT/android-app
BUILD=$APP/build
TC=$ROOT/.toolchain
BT=$TC/build-tools/34.0.0
JAR=$TC/platforms/android-33/android.jar
KEYSTORE=$ROOT/download/SLP-BILLING-SIGNING.keystore
KS_PASS=slpbilling2026
KS_ALIAS=slpbilling

export JAVA_HOME=$TC/jdk
export PATH=$JAVA_HOME/bin:$PATH

VERSION_CODE=${1:-1}
VERSION_NAME=${2:-1.0}

rm -rf "$BUILD"
mkdir -p "$BUILD/gen" "$BUILD/classes" "$BUILD/dex"

# signing keystore: create once, reuse for every future update (same key required)
if [ ! -f "$KEYSTORE" ]; then
  mkdir -p "$ROOT/download"
  keytool -genkeypair -keystore "$KEYSTORE" -alias "$KS_ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$KS_PASS" -keypass "$KS_PASS" \
    -dname "CN=SLP Billing, OU=Cement Works, O=SLP, C=IN"
  echo "keystore created: $KEYSTORE (store/key pass: $KS_PASS, alias: $KS_ALIAS)"
fi

echo "== aapt2: compile resources =="
"$BT/aapt2" compile --dir "$APP/res" -o "$BUILD/res.zip"

echo "== aapt2: link =="
"$BT/aapt2" link \
  -o "$BUILD/base.apk" \
  -I "$JAR" \
  --manifest "$APP/AndroidManifest.xml" \
  -R "$BUILD/res.zip" \
  --java "$BUILD/gen" \
  --auto-add-overlay \
  --min-sdk-version 24 \
  --target-sdk-version 33 \
  --version-code "$VERSION_CODE" \
  --version-name "$VERSION_NAME"

echo "== javac =="
javac --release 8 -nowarn \
  -classpath "$JAR" \
  -d "$BUILD/classes" \
  "$APP/src/com/slp/billing/MainActivity.java" \
  "$BUILD/gen/com/slp/billing/R.java"

echo "== d8: dex =="
# note: build-tools 34.0.0's bundled d8 is a buggy dev build (NPEs on
# anonymous classes); use the official r8 8.3.37 jar instead
jar cf "$BUILD/classes.jar" -C "$BUILD/classes" .
java -cp "$TC/r8/r8.jar" com.android.tools.r8.D8 \
  --release --lib "$JAR" --min-api 24 --output "$BUILD/dex" "$BUILD/classes.jar"

echo "== package dex into apk =="
cp "$BUILD/base.apk" "$BUILD/base-classes.apk"
(cd "$BUILD/dex" && zip -q "$BUILD/base-classes.apk" classes.dex)

echo "== zipalign =="
"$BT/zipalign" -f 4 "$BUILD/base-classes.apk" "$BUILD/aligned.apk"

echo "== apksigner =="
"$BT/apksigner" sign \
  --ks "$KEYSTORE" --ks-key-alias "$KS_ALIAS" \
  --ks-pass "pass:$KS_PASS" --key-pass "pass:$KS_PASS" \
  --out "$BUILD/slp-billing.apk" "$BUILD/aligned.apk"

echo "== verify =="
"$BT/apksigner" verify --print-certs "$BUILD/slp-billing.apk" | head -4
ls -lh "$BUILD/slp-billing.apk"
echo "DONE: $BUILD/slp-billing.apk"
