# See the results in https://pypi.org/project/weyland/
if [ -f "build" ]; then
    rm -rf "build"
fi
if [ -f "dist" ]; then
    rm -rf "dist"
fi
python3 setup.py sdist bdist_wheel
twine upload dist/*
rm -rf "weyland.egg-info"
rm -rf "build"
rm -rf "dist"

