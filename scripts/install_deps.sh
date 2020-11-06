#!/usr/bin/env bash

set -ex

# Install Clingo dependencies.

apt-get update
apt-get upgrade -y
apt-get install bison re2c -y
