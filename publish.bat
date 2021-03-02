REM See the results in https://pypi.org/project/weyland/
if exist dist (
    rmdir dist /S /Q
)
python setup.py sdist bdist_wheel
twine upload dist/*
rmdir weyland.egg-info /S /Q
rmdir build /S /Q