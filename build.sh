#!/usr/bin/bash
set -o errexit -o errtrace -o nounset -o pipefail

families=${1:-flat hyperlegible}
spacings=${2:-normal term fixed proportional}

plans=''
for family in $families; do
    for spacing in $spacings; do
        plans="$plans super-ttc::iosevka-${family}-${spacing}"
    done
done

node_modules/.bin/verda -f verdafile.js $plans
