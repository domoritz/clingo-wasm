#!/usr/bin/env bash

set -ex

# Install Clingo dependencies.

apt update
apt upgrade -y
apt install bison re2c -y
