<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Trusted Web Activity (Play Store build)
    |--------------------------------------------------------------------------
    |
    | The Android app is a TWA wrapping this site. Chrome only hides the URL
    | bar if /.well-known/assetlinks.json served from THIS domain names the
    | app's package and signing certificate. Get the fingerprints with:
    |
    |   # upload key (the keystore Bubblewrap generated)
    |   keytool -list -v -keystore android.keystore -alias android \
    |     | grep 'SHA256:' | cut -d' ' -f3
    |
    |   # Play App Signing key — Play Console > Release > Setup > App signing
    |
    | BOTH must be listed. Google re-signs your upload with its own key, so an
    | app that verifies in local testing will still show the URL bar in the
    | Play-distributed build if only the upload fingerprint is present.
    |
    */

    'package' => env('TWA_PACKAGE_NAME', 'com.sheltrify.app'),

    'fingerprints' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('TWA_SHA256_FINGERPRINTS', ''))
    ))),

];
