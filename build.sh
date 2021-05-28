#!/usr/bin/bash
set -o errexit -o errtrace -o nounset -o pipefail

plans=''
for family in flat hyperlegible; do
    for spacing in '' -term -fixed -proportional -super; do
        plans="$plans super-ttc::iosevka-${family}${spacing}"
    done
done

node_modules/.bin/verda -f verdafile.js $plans
