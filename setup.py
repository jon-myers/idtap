# python/idtap_api/setup.py
from setuptools import setup, find_packages

setup(
    name="idtap_api",
    version="0.1.0",
    packages=find_packages(where="python", include=["idtap_api*"]),
    package_dir={"": "python"},
    install_requires=[
        "requests",
        "pymongo",
        "google-auth-oauthlib",
    ],
)
