from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.on('dialog', lambda dialog: dialog.accept())
    page.goto("http://localhost:8000/index.html")
    page.wait_for_timeout(1000)

    # Inject mock MAKER_CONFIG and makerAPI
    page.evaluate("""
        window.MAKER_CONFIG = {
            scriptUrl: 'https://script.google.com/macros/s/AKfycbzpObs8-mFfHb_TUWVDwJfx7iBvxmLTnnE0seAm8fplvTloxE7CLXkgvEc2RHXlt_hFtw/exec',
            fetchFromDatabase: async (sheet) => {
                const res = await fetch('https://script.google.com/macros/s/AKfycbzpObs8-mFfHb_TUWVDwJfx7iBvxmLTnnE0seAm8fplvTloxE7CLXkgvEc2RHXlt_hFtw/exec?sheet=' + encodeURIComponent(sheet));
                return await res.json();
            },
            saveToDatabase: async () => {}
        };
        window.makerAPI = {
            readData: async () => [],
            writeData: async () => {}
        };
    """)

    # Click Suppliers nav item
    page.locator(".nav-item[data-panel='suppliers']").click()
    page.wait_for_timeout(2000)

    # Click Sync button
    page.locator("#sup-sync").click()
    page.wait_for_timeout(3000)

    # Scroll down to table
    page.locator("#sup-tbody").scroll_into_view_if_needed()
    page.wait_for_timeout(1000)

    # Take screenshot
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
