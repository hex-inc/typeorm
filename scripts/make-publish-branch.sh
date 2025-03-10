#!/usr/bin/env bash

TEMP="/tmp/typeorm-tmp"

rm -rf $TEMP 
mkdir $TEMP
cp -r ./build/package/* $TEMP
rm -rf ./*
cp -r $TEMP/* ./
