from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = fh.read().splitlines()

setup(
    name="onchainsage-data-processing",
    version="0.1.0",
    author="OnChainSage Team",
    author_email="team@onchainsage.com",
    description="Data processing pipeline for OnChainSage platform",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/onchainsage/data-processing",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "onchainsage=onchainsage.cli:main",
        ],
    },
) 