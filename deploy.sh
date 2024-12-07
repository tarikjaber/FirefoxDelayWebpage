if [ -f code.zip ]; then
    rm code.zip
fi

zip -r code.zip ./*.png ./*.js ./*.html ./*.json
