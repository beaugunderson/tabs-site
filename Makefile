all: public/styles.css

public/styles.css: public/styles.scss
	@echo "SASSing..."
	@sass public/styles.scss > public/styles.css
