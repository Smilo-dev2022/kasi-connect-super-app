SHELL := /bin/bash

.PHONY: gen open clean

gen:
	cd $(CURDIR) && xcodegen generate --spec project.yml

open:
	open Agent3.xcodeproj

clean:
	rm -rf Agent3.xcodeproj