#!/usr/bin/env python

from setuptools import setup

setup(
    name='geodash-server',
    version='0.0.1',
    install_requires=[],
    author='GeoDash Developers',
    author_email='pjdufour.dev@gmail.com',
    license='BSD License',
    url='https://github.com/geodashio/geodash-server',
    keywords='python gis geodash',
    description='GeoDash server.',
    long_description=open('README.rst').read(),
    download_url="https://github.com/geodashio/geodash-server/zipball/master",
    packages=[
        "geodashserver",
        "geodashserver.tests"],
    classifiers = [
        'Development Status :: 3 - Alpha',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: BSD License',
        'Topic :: Software Development :: Libraries :: Python Modules'
    ]
)
