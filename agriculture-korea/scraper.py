#scraper for extracting code name pairs for crops in 농사로
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import re
def scrape_crop_codes():
    # Initialize the Chrome driver
    driver = webdriver.Chrome()
    driver.get("https://nongsaro.go.kr/portal/farmTechMain.ps?menuId=PS65291&stdPrdlstCode=FC050502")
    dict = {}

    # Wait for the page to load and the table to be present
    wait = WebDriverWait(driver, 15)
    button = wait.until(EC.presence_of_element_located((By.XPATH, "//button[text()='상세검색']")))
    button.click()
    category_list = wait.until(EC.presence_of_element_located((By.XPATH, "//ul[@class='cmItem_list']")))
    cats = category_list.find_elements(By.TAG_NAME, "li")
    for cat in cats:
        cat.click()
        # Wait for the search results to load
        children = wait.until(EC.presence_of_all_elements_located((By.XPATH, "//ul[@class='cmKind_list']/*")))
        print([child.get_attribute('id') for child in children])
        for (index, code) in enumerate([child.get_attribute('id')[10:] for child in children]):
            dict[code] = children[index].text
    # Print the dictionary of code-name pairs
    print(dict)
    # Close the driver
    driver.quit()
    # Save the dictionary to a file
    with open("crop_codes.txt", "w", encoding="utf-8") as f:
        for code, name in dict.items():
            f.write(f"{code}: {name}\n")
    # Save the dictionary to a JSON file
    with open("crop_codes.json", "w", encoding="utf-8") as f:
        json.dump(dict, f, ensure_ascii=False, indent=4)

def scrape_crop_info():
    try:
        with open("crop_codes.json", "r", encoding="utf-8") as f:
            crop_codes = json.load(f)
    except FileNotFoundError:
        print("crop_codes.json not found. Please run scrape_crop_codes() first.")
        return -1
    res = []

    driver = webdriver.Chrome()
    i = 0
    for code, name in crop_codes.items():
        driver.get(f"https://nongsaro.go.kr/portal/farmTechMain.ps?menuId=PS65291&stdPrdlstCode={code}")
        wait = WebDriverWait(driver, 5)
        try:
            # Wait for the crop information to load
            cultivars = []
            try:
                info_element = wait.until(EC.presence_of_element_located((By.ID, "sectionCrop03")))
                info_cultivars = info_element.find_elements(By.TAG_NAME, "li")
                for cultivar in info_cultivars:
                    cultivar_name = cultivar.find_element(By.TAG_NAME, "strong").get_attribute("textContent").strip()
                    cultivar_url = cultivar.find_element(By.TAG_NAME, "img").get_attribute("src")
                    cultivar_use = cultivar.find_element(By.CLASS_NAME, "txt-A").get_attribute("textContent").strip()
                    cultivar_function = cultivar.find_element(By.CLASS_NAME, "txt-B").get_attribute("textContent").strip()
                    #print(f"{name} ({code}) - Cultivar: {cultivar_name}, Use: {cultivar_use}, Function: {cultivar_function}")
                    cultivars.append({
                        "name": cultivar_name,
                        "url": cultivar_url,
                        "use": cultivar_use,
                        "function": cultivar_function
                    })
            except Exception as e:
                print(f"Error retrieving cultivars for {name} ({code}): {e}")
            tableData = {}
            try:
                info_element = driver.find_element(By.ID, "sectionCrop05")
                buttons = info_element.find_elements(By.XPATH, "//ul[contains(@class, 'clearfix')]")
                print(buttons)
                ids = []
                tables = []
                titles = []
                links = []
                if len(buttons) == 0:
                    tables = info_element.find_elements(By.XPATH, "//*[contains(@id, 'contentBox')]")
                    tbl = info_element.find_element(By.XPATH, "//*[contains(@id, 'contentBox')]")
                    ids = [re.search(r"[A-Za-z](\d+)",tbl.get_attribute("id").strip()).group(1)]
                else:
                    button = buttons[0]
                    links = button.find_elements(By.TAG_NAME, "a")
                    titles = [link.get_attribute("textContent").strip() for link in links]
                    ids = [re.search(r"[\"\'](\d+)[\"\']",link.get_attribute("onclick").strip()).group(1) for link in links]
                    #print('two')
                    tables = info_element.find_elements(By.XPATH, "//*[contains(@id, 'contentBox')]")
                print(ids, len(buttons), len(links))
                for _, id in enumerate(ids):
                    if len(titles) > 0:
                        tableData[id] = {'title': titles[_], 'tables': []}
                    else:
                        tableData[id] = {'title': '', 'tables': []}
                for table in tables:
                    title = table.find_element(By.TAG_NAME, "h5").get_attribute("textContent").strip()
                    rows = table.find_element(By.TAG_NAME, "tbody").find_elements(By.TAG_NAME, "tr")
                    ict_ = {
                        "title": title,
                        "rows": []
                    }
                    for row in rows:
                        cells = row.find_elements(By.TAG_NAME, "td")
                        col = 0
                        ans = []
                        for cell in cells:
                            a = cell.get_attribute("textContent").strip()
                            ict = {}
                            start_col = col
                            if cell.get_attribute('colspan') is not None:
                                colspan = int(cell.get_attribute('colspan'))
                                col += colspan
                            else:
                                col += 1
                            if len(a) > 0:
                                ict = {'name': a, 'start_col': start_col, 'end_col': col}
                                ans.append(ict)
                        #print(f"{name} ({code}) - {title}: {ans}")
                        if len(ans) > 0:
                            ict_["rows"].append(ans)
                   
                    id = re.search(r"[A-Za-z](\d+)",table.get_attribute("id").strip()).group(1)
                    tableData[id]['tables'].append(ict_)
            except Exception as e:
                print(f"Error retrieving tables for {name} ({code}): {e}")
            cards = []
            try:
                info_element = driver.find_element(By.ID, "sectionCrop06")
                info_cards = info_element.find_elements(By.TAG_NAME, "li")
                for card in info_cards:
                    card_title = card.find_element(By.CLASS_NAME, "tTxt").get_attribute("textContent").strip()
                    card_url = card.find_element(By.TAG_NAME, "img").get_attribute("src")
                    #print(f"{name} ({code}) - Card: {card_title}, URL: {card_url}")
                    cards.append({
                        "title": card_title,
                        "url": card_url
                    })
            except Exception as e:
                print(f"Error retrieving cards for {name} ({code}): {e}")
            res.append({
                "code": code,
                "name": name,
                "cultivars": cultivars,
                "tables": tableData,
                "cards": cards
            })
            print(f"Retrieved info for {name} ({code}), {i+1}/{len(crop_codes)}")
            i += 1
        except Exception as e:
            print(f"Error retrieving info for {name} ({code}): {e}, {i+1}/{len(crop_codes)}")
            i += 1
    # Close the driver
    driver.quit()
    # Save the results to a JSON file
    with open("crop_info.json", "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=4)
    return res


if __name__ == "__main__":
    print('Pick a type of scraping:')
    print('1. Crop codes')
    print('2. Crop information')
    print('3. Quit')
    choice = input('Enter your choice (1 or 2): ')
    if choice == '1':
        scrape_crop_codes()
    elif choice == '2':
        res = scrape_crop_info()
    else:
        print("Exiting the scraper.")
        exit(0)
            


