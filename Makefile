

.PHONY: clean

clean:
	rm -rf build 
	rm -rf dist

dist:
	python setup.py sdist
	python setup.py bdist_wheel

upload: dist
	twine upload dist/*

