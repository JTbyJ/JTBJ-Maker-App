import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        # Add mock window.makerAPI before navigation
        await page.add_init_script("""
            window.makerAPI = {
                readData: async (filename) => {
                    if (filename === 'suppliers.json') {
                        return [
                            {
                                id: 'sup001',
                                name: 'Amazon Canada',
                                category: 'Craft Supplies',
                                status: 'Active',
                                rating: 5,
                                website: 'amazon.ca',
                                contact: 'Support',
                                email: 'support@amazon.ca',
                                phone: '',
                                lead: '1-2 days',
                                minOrder: 'None',
                                shipping: 'Prime',
                                notes: 'Fast shipping'
                            }
                        ];
                    }
                    return [];
                },
                writeData: async (filename, data) => true
            };
        """)

        await page.goto("http://localhost:8000/index.html")
        await page.wait_for_timeout(2000)

        # Click Suppliers nav tab
        await page.click("[data-panel='suppliers']")
        await page.wait_for_timeout(2000)

        await page.screenshot(path="/home/jules/verification/screenshots/verification_suppliers_fixed.png")
        await browser.close()

asyncio.run(run())
