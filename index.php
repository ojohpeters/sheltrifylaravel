<?php

// cPanel bridge — domain root is public_html/ but Laravel lives in public/.
// This file catches any request the .htaccess rewrite misses (e.g. mod_rewrite disabled).
require __DIR__.'/public/index.php';
