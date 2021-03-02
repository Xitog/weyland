from setuptools import setup
import weyland

f = open('README.txt', mode='r', encoding='utf8')
long_desc = f.read()
f.close()

setup(
    # Metadata
    name='weyland',
    version=weyland.__version__,

    license="MIT",

    author='Damien Gouteux',
    author_email='damien.gouteux@gmail.com',
    url="https://xitog.github.io/dgx",
    maintainer='Damien Gouteux',
    maintainer_email='damien.gouteux@gmail.com',
    
    description='An alternative way to write regular expression and a lexer using them.',
    long_description=long_desc,
    long_description_content_type="text/markdown",
    # https://pypi.org/classifiers/
    classifiers=[
        'Development Status :: 3 - Alpha',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Programming Language :: Python :: 3 :: Only',
        'Programming Language :: Python :: Implementation :: CPython',
        'Topic :: Software Development :: Libraries :: Python Modules',
        'Topic :: Software Development :: Documentation',
        'Topic :: Text Processing',
        'Programming Language :: Other'
    ],
    keywords=['weyland', 'lexer', 'regular expression', 'regex', 'text', 'languages'],
    
    packages=['weyland'],  #same as name
    python_requires='>=3.5', # 3.5 for f'', 3.8 for f'{a=}'
    #zip_safe=True,
    #install_requires=[], #external packages as dependencies
    #extras_require={}
)
