# This tries to find a python linter, defaults to the NOP if none found
# Looks for: pyflakes and flake8 (for now)
LINTER=$(shell if which flake8 > /dev/null ; \
		then which flake8; \
		elif which pyflakes > /dev/null ; \
		then which pyflakes; \
		else which true; fi )

init:
	vagrant up

unittest:
	nosetests --with-color ./tests/*.py

lint:
	${LINTER} ./rpg/*.py
	${LINTER} ./rpg/database/*.py

test: lint unittest

clean:
	rm rpg/*.pyc
	rm rpg/database/*.pyc

serve:
	./bin/workhammer

compile:
	mkdir -p ./static/css
	for file in $(basename $(notdir $(wildcard ./static/less/*.less))); do \
		lessc ./static/less/$${file}.less ./static/css/$${file}.css; \
	done;
