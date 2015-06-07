

.PHONY: clean

clean:
	rm -rf build 
	rm -rf dist
	rm -rf docs

dist:
	python setup.py sdist
	python setup.py bdist_wheel
	python3 setup.py bdist_wheel

upload: dist
	twine upload dist/*


docs: jupyterdrive/ts/*.ts
	typedoc --out docs --mode file --externalPattern 'typings/*' jupyterdrive/ts/* typings/* --module amd


