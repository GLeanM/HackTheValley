#!/usr/bin/env bash
# Converts the trash classifier to ONNX and copies the Transformers.js runtime into public/,
# so public/classifier.html can run it on-device (web iframe + native WebView).
# Output is gitignored; re-run after cloning:  npm run build:model
set -euo pipefail

MODEL_ID="dima806/garbage_types_image_detection"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="$ROOT/server/.venv"
OUT="$ROOT/public/models/$MODEL_ID"
VENDOR="$ROOT/public/vendor"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if [ ! -x "$VENV/bin/python" ]; then
  python3 -m venv "$VENV"
fi
"$VENV/bin/pip" install -q -r "$ROOT/server/requirements.txt" "optimum[onnxruntime]" onnx

echo "Exporting $MODEL_ID to ONNX..."
"$VENV/bin/optimum-cli" export onnx --model "$MODEL_ID" --task image-classification "$TMP/export"

echo "Quantizing to int8..."
mkdir -p "$OUT/onnx"
"$VENV/bin/python" -I -c '
import sys
from onnxruntime.quantization import QuantType, quantize_dynamic
quantize_dynamic(sys.argv[1], sys.argv[2], weight_type=QuantType.QUInt8)
' "$TMP/export/model.onnx" "$OUT/onnx/model_quantized.onnx"
cp "$TMP/export/config.json" "$TMP/export/preprocessor_config.json" "$OUT/"

echo "Copying Transformers.js runtime..."
mkdir -p "$VENDOR"
cp "$ROOT/node_modules/@huggingface/transformers/dist/transformers.min.js" "$VENDOR/"
cp "$ROOT"/node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded*.{mjs,wasm} "$VENDOR/"

du -sh "$OUT" "$VENDOR"
echo "Done."
