#!/usr/bin/env bash

set -e
set -x

# Install Clingo dependencies.

apt update
apt upgrade -y
apt install bison re2c -y
