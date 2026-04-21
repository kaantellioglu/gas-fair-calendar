install:
	pip install -e .[dev]

update:
	gas-fair-calendar update

html:
	gas-fair-calendar build-html

excel:
	gas-fair-calendar export-excel

validate:
	gas-fair-calendar validate
