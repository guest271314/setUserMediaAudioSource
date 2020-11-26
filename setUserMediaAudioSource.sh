#!/bin/bash
pactl move-source-output "$1" "$2"
echo 'ok'
