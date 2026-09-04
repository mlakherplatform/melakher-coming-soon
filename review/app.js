
(() => {

  // =========================================================
  // FIELD LABELS
  // =========================================================

  const FIELD_LABELS = {
    nameAr: "الاسم بالعربي",
    nameEn: "الاسم بالإنجليزي",
    slug: "المعرّف",
    commercialName: "الاسم التجاري",
    stoneFamily: "عائلة الحجر",
    category: "التصنيف",
    materialClass: "فئة الخامة",
    originType: "نوع المنشأ",
    country: "الدولة",
    region: "المنطقة",
    color: "اللون",
    description: "الوصف",
    advantages: "المزايا",
    disadvantages: "العيوب",
    commonUses: "الاستخدامات الشائعة",
    aliases: "الأسماء البديلة",
    availableFinishes: "التشطيبات المتاحة",
    status: "الحالة"
  };

  function getFieldLabel(key) {
    return FIELD_LABELS[key] || key;
  }

  // =========================================================
  // DATASET CONFIG
  // =========================================================

  const DATASET_ID = "granite-part-4";

  const DATASET_NAME =
    "Egyptian Granite — Part 4";

  const DATA_FOLDER_FILE =
    "./data/egyptianGraniteMaterials.js";

  const STORAGE_KEY =
    `material-review-tool:v2:${DATASET_ID}`;

  // =========================================================
  // DATA
  // =========================================================

  let data =
    Array.isArray(window.egyptianGraniteMaterials)
      ? window.egyptianGraniteMaterials
      : [];

  let currentIndex = 0;

  let visibleIndexes = [];

  // =========================================================
  // DOM HELPER
  // =========================================================

  const $ = id =>
    document.getElementById(id);

  // =========================================================
  // CLONE
  // =========================================================

  function clone(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }

  // =========================================================
  // LOCAL STORAGE
  // =========================================================

  function loadState() {

    try {

      const raw =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!raw) {
        return;
      }

      const saved =
        JSON.parse(raw);

      if (
        !Array.isArray(
          saved.data
        )
      ) {
        return;
      }

      data =
        saved.data;

    } catch (error) {

      console.warn(
        "Could not load saved state:",
        error
      );
    }
  }

  function saveState() {

    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 2,
          savedAt:
            new Date().toISOString(),
          data
        })
      );

    } catch (error) {

      console.error(
        "Could not save state:",
        error
      );

      showMessage(
        "تعذر الحفظ في localStorage. قد تكون مساحة التخزين ممتلئة."
      );
    }
  }

  // =========================================================
  // REVIEW STATUS
  // =========================================================

  function reviewedStatus(item) {

    return (
      item?.review?.status ||
      null
    );
  }

  // =========================================================
  // STATS
  // =========================================================

  function updateStats() {

    const total =
      data.length;

    const reviewed =
      data.filter(
        item =>
          reviewedStatus(item)
      ).length;

    const correct =
      data.filter(
        item =>
          reviewedStatus(item) ===
          "CORRECT"
      ).length;

    const incorrect =
      data.filter(
        item =>
          reviewedStatus(item) ===
          "INCORRECT"
      ).length;

    const totalStat =
      $("totalStat");

    const reviewedStat =
      $("reviewedStat");

    const correctStat =
      $("correctStat");

    const incorrectStat =
      $("incorrectStat");

    const remainingStat =
      $("remainingStat");

    if (totalStat) {
      totalStat.textContent =
        total;
    }

    if (reviewedStat) {
      reviewedStat.textContent =
        reviewed;
    }

    if (correctStat) {
      correctStat.textContent =
        correct;
    }

    if (incorrectStat) {
      incorrectStat.textContent =
        incorrect;
    }

    if (remainingStat) {
      remainingStat.textContent =
        total - reviewed;
    }
  }

  // =========================================================
  // SEARCH
  // =========================================================

  function matchesSearch(item, query) {

    if (!query) {
      return true;
    }

    return JSON.stringify(item)
      .toLowerCase()
      .includes(
        query.toLowerCase()
      );
  }

  // =========================================================
  // VISIBLE ITEMS
  // =========================================================

  function rebuildVisible() {

    const searchInput =
      $("searchInput");

    const filterSelect =
      $("filterSelect");

    const q =
      searchInput
        ? searchInput.value.trim()
        : "";

    const filter =
      filterSelect
        ? filterSelect.value
        : "ALL";

    visibleIndexes =
      data
        .map((item, index) => ({
          item,
          index
        }))
        .filter(({ item }) => {

          const status =
            reviewedStatus(item);

          const filterOk =
            filter === "ALL" ||
            (
              filter === "UNREVIEWED" &&
              !status
            ) ||
            status === filter;

          return (
            filterOk &&
            matchesSearch(
              item,
              q
            )
          );
        })
        .map(
          result =>
            result.index
        );

    if (
      !visibleIndexes.length
    ) {

      renderEmpty();

      return;
    }

    if (
      !visibleIndexes.includes(
        currentIndex
      )
    ) {

      currentIndex =
        visibleIndexes[0];
    }

    renderItem();
  }

  // =========================================================
  // EMPTY STATE
  // =========================================================

  function renderEmpty() {

    const itemPosition =
      $("itemPosition");

    const itemStatus =
      $("itemStatus");

    const datasetName =
      $("datasetName");

    const itemEditor =
      $("itemEditor");

    const notesInput =
      $("notesInput");

    if (itemPosition) {
      itemPosition.textContent =
        "0 / 0";
    }

    if (itemStatus) {

      itemStatus.textContent =
        "لا توجد نتائج";

      itemStatus.className =
        "badge neutral";
    }

    if (datasetName) {

      datasetName.textContent =
        DATASET_NAME;
    }

    if (itemEditor) {

      itemEditor.innerHTML = `
        <div class="empty">
          لا توجد عناصر مطابقة للبحث أو الفلتر.
        </div>
      `;
    }

    if (notesInput) {
      notesInput.value = "";
    }
  }

  // =========================================================
  // RENDER VALUE
  // =========================================================

  function renderValue(
    key,
    value
  ) {

    const wrapper =
      document.createElement(
        "div"
      );

    wrapper.className =
      "editor-value";

    // =======================================================
    // ARRAY
    // =======================================================

    if (Array.isArray(value)) {

      const list =
        document.createElement(
          "div"
        );

      list.className =
        "array-list";

      value.forEach(
        (itemValue, index) => {

          const row =
            document.createElement(
              "div"
            );

          row.className =
            "array-item";

          // -------------------------------------------------
          // INPUT
          // -------------------------------------------------

          const input =
            document.createElement(
              "input"
            );

          input.value =
            typeof itemValue === "string"
              ? itemValue
              : JSON.stringify(
                  itemValue
                );

          input.dataset.path =
            key;

          input.dataset.index =
            index;

          input.dataset.kind =
            "array";

          // -------------------------------------------------
          // SAVE WHILE TYPING
          // -------------------------------------------------

          input.addEventListener(
            "input",
            () => {

              const item =
                data[currentIndex];

              const itemIndex =
                Number(
                  input.dataset.index
                );

              if (!item) {
                return;
              }

              if (
                !Array.isArray(
                  item[key]
                )
              ) {
                return;
              }

              item[key][itemIndex] =
                input.value;

              saveState();
            }
          );

          // -------------------------------------------------
          // DELETE
          // -------------------------------------------------

          const del =
            document.createElement(
              "button"
            );

          del.className =
            "secondary";

          del.type =
            "button";

          del.textContent =
            "حذف";

          del.onclick =
            () => {

              const item =
                data[currentIndex];

              if (!item) {
                return;
              }

              if (
                !Array.isArray(
                  item[key]
                )
              ) {
                return;
              }

              item[key].splice(
                index,
                1
              );

              saveState();

              renderItem();
            };

          row.append(
            input,
            del
          );

          list.appendChild(
            row
          );
        }
      );

      // =====================================================
      // ADD
      // =====================================================

      const add =
        document.createElement(
          "button"
        );

      add.className =
        "secondary";

      add.type =
        "button";

      add.textContent =
        "+ إضافة";

      add.onclick =
        () => {

          const item =
            data[currentIndex];

          if (!item) {
            return;
          }

          if (
            !Array.isArray(
              item[key]
            )
          ) {
            item[key] = [];
          }

          item[key].push("");

          saveState();

          renderItem();

          setTimeout(
            () => {

              const inputs =
                $("itemEditor")
                  ?.querySelectorAll(
                    `input[data-path="${key}"]`
                  );

              if (!inputs?.length) {
                return;
              }

              const lastInput =
                inputs[
                  inputs.length - 1
                ];

              lastInput.focus();

            },
            0
          );
        };

      wrapper.append(
        list,
        add
      );

      return wrapper;
    }

    // =======================================================
    // OBJECT / JSON
    // =======================================================

    if (
      value !== null &&
      typeof value === "object"
    ) {

      const textarea =
        document.createElement(
          "textarea"
        );

      textarea.value =
        JSON.stringify(
          value,
          null,
          2
        );

      textarea.dataset.path =
        key;

      textarea.dataset.kind =
        "json";

      textarea.addEventListener(
        "change",
        () => {

          try {

            data[currentIndex][key] =
              JSON.parse(
                textarea.value
              );

            saveState();

            showMessage(
              "تم تعديل القيمة وحفظها محليًا."
            );

          } catch {

            showMessage(
              "القيمة JSON غير صحيحة."
            );

            renderItem();
          }
        }
      );

      wrapper.appendChild(
        textarea
      );

      return wrapper;
    }

    // =======================================================
    // SCALAR
    // =======================================================

    const input =
      document.createElement(
        "input"
      );

    input.value =
      value ?? "";

    input.dataset.path =
      key;

    input.dataset.kind =
      "scalar";

    input.addEventListener(
      "change",
      () => {

        const item =
          data[currentIndex];

        if (!item) {
          return;
        }

        item[key] =
          input.value;

        saveState();

        updateStats();
      }
    );

    wrapper.appendChild(
      input
    );

    return wrapper;
  }

  // =========================================================
  // RENDER CURRENT ITEM
  // =========================================================

  function renderItem() {

    const item =
      data[currentIndex];

    if (!item) {

      renderEmpty();

      return;
    }

    const position =
      visibleIndexes.indexOf(
        currentIndex
      ) + 1;

    const itemPosition =
      $("itemPosition");

    const datasetName =
      $("datasetName");

    const itemStatus =
      $("itemStatus");

    const notesInput =
      $("notesInput");

    const editor =
      $("itemEditor");

    if (itemPosition) {

      itemPosition.textContent =
        `${position} / ${visibleIndexes.length}`;
    }

    if (datasetName) {

      datasetName.textContent =
        DATASET_NAME;
    }

    // =======================================================
    // STATUS
    // =======================================================

    const status =
      reviewedStatus(item);

    if (itemStatus) {

      itemStatus.textContent =
        status === "CORRECT"
          ? "Correct"
          : status === "INCORRECT"
            ? "Incorrect"
            : "غير مراجع";

      itemStatus.className =
        `badge ${
          status === "CORRECT"
            ? "correct"
            : status === "INCORRECT"
              ? "incorrect"
              : "neutral"
        }`;
    }

    // =======================================================
    // NOTES
    // =======================================================

    if (notesInput) {

      notesInput.value =
        item.review?.notes ||
        "";
    }

    // =======================================================
    // EDITOR
    // =======================================================

    if (!editor) {
      return;
    }

    editor.innerHTML = "";

    Object.entries(item).forEach(
      ([key, value]) => {

        if (key === "review") {
          return;
        }

        const row =
          document.createElement(
            "div"
          );

        row.className =
          "editor-row";

        const keyElement =
          document.createElement(
            "div"
          );

        keyElement.className =
          "editor-key";

        keyElement.textContent =
          getFieldLabel(key);

        row.append(
          keyElement,
          renderValue(
            key,
            value
          )
        );

        editor.appendChild(
          row
        );
      }
    );

    updateStats();
  }

  // =========================================================
  // MESSAGE
  // =========================================================

  function showMessage(message) {

    const element =
      $("saveMessage");

    if (!element) {
      return;
    }

    element.textContent =
      message;

    clearTimeout(
      showMessage.timer
    );

    showMessage.timer =
      setTimeout(
        () => {

          element.textContent =
            "";

        },
        5000
      );
  }

  // =========================================================
  // SET REVIEW
  // =========================================================

  function setReview(status) {

    const item =
      data[currentIndex];

    if (!item) {
      return;
    }

    item.review = {

      reviewed: true,

      status,

      notes:
        $("notesInput")
          ?.value
          .trim() || "",

      reviewedAt:
        new Date().toISOString()
    };

    saveState();

    updateStats();

    renderItem();
  }

  // =========================================================
  // CLEAR REVIEW
  // =========================================================

  function clearReview() {

    if (!data[currentIndex]) {
      return;
    }

    delete data[
      currentIndex
    ].review;

    saveState();

    renderItem();
  }

  // =========================================================
  // DONE
  // =========================================================

  function done() {

    const item =
      data[currentIndex];

    if (!item) {
      return;
    }

    const editor =
      $("itemEditor");

    // =======================================================
    // SAVE CURRENT EDITOR
    // =======================================================

    if (editor) {

      // -----------------------------------------------------
      // SCALAR
      // -----------------------------------------------------

      const scalarInputs =
        editor.querySelectorAll(
          'input[data-kind="scalar"]'
        );

      scalarInputs.forEach(
        input => {

          const key =
            input.dataset.path;

          if (!key) {
            return;
          }

          item[key] =
            input.value;
        }
      );

      // -----------------------------------------------------
      // ARRAY
      // -----------------------------------------------------

      const arrayInputs =
        editor.querySelectorAll(
          'input[data-kind="array"]'
        );

      arrayInputs.forEach(
        input => {

          const key =
            input.dataset.path;

          const index =
            Number(
              input.dataset.index
            );

          if (
            !key ||
            !Number.isInteger(index)
          ) {
            return;
          }

          if (
            !Array.isArray(
              item[key]
            )
          ) {
            return;
          }

          item[key][index] =
            input.value;
        }
      );

      // -----------------------------------------------------
      // JSON
      // -----------------------------------------------------

      const jsonTextareas =
        editor.querySelectorAll(
          'textarea[data-kind="json"]'
        );

      for (
        const textarea
        of jsonTextareas
      ) {

        const key =
          textarea.dataset.path;

        if (!key) {
          continue;
        }

        try {

          item[key] =
            JSON.parse(
              textarea.value
            );

        } catch {

          showMessage(
            `القيمة الخاصة بـ "${getFieldLabel(key)}" تحتوي JSON غير صحيح.`
          );

          textarea.focus();

          return;
        }
      }
    }

    // =======================================================
    // CHECK STATUS
    // =======================================================

    let status =
      reviewedStatus(item);

    if (!status) {

      showMessage(
        "اختر Correct أو Incorrect أولًا."
      );

      return;
    }

    // =======================================================
    // SAVE REVIEW
    // =======================================================

    item.review = {

      reviewed: true,

      status,

      notes:
        $("notesInput")
          ?.value
          .trim() || "",

      reviewedAt:
        new Date().toISOString()
    };

    // =======================================================
    // SAVE EVERYTHING
    // =======================================================

    saveState();

    updateStats();

    showMessage(
      "✓ تم حفظ التعديلات والمراجعة."
    );

    // =======================================================
    // MOVE NEXT
    // =======================================================

    const currentPosition =
      visibleIndexes.indexOf(
        currentIndex
      );

    const nextPosition =
      currentPosition + 1;

    if (
      currentPosition >= 0 &&
      nextPosition <
        visibleIndexes.length
    ) {

      currentIndex =
        visibleIndexes[
          nextPosition
        ];

      renderItem();

      return;
    }

    showMessage(
      "✓ تم حفظ العنصر. وصلت إلى آخر عنصر."
    );
  }

  // =========================================================
  // MOVE
  // =========================================================

  function move(delta) {

    if (
      !visibleIndexes.length
    ) {
      return;
    }

    let position =
      visibleIndexes.indexOf(
        currentIndex
      );

    position =
      Math.max(
        0,
        Math.min(
          visibleIndexes.length - 1,
          position + delta
        )
      );

    currentIndex =
      visibleIndexes[position];

    renderItem();
  }

  // =========================================================
  // GO TO NUMBER
  // =========================================================

  function goToVisibleNumber(
    value
  ) {

    if (
      !visibleIndexes.length
    ) {
      return;
    }

    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return;
    }

    const position =
      Math.max(
        1,
        Math.min(
          visibleIndexes.length,
          number
        )
      ) - 1;

    currentIndex =
      visibleIndexes[position];

    renderItem();
  }

  // =========================================================
  // DOWNLOAD
  // =========================================================

  function download(
    filename,
    content,
    type
  ) {

    const blob =
      new Blob(
        [content],
        { type }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href =
      url;

    anchor.download =
      filename;

    document.body.appendChild(
      anchor
    );

    anchor.click();

    document.body.removeChild(
      anchor
    );

    setTimeout(
      () => {

        URL.revokeObjectURL(
          url
        );

      },
      1000
    );
  }

  // =========================================================
  // EXPORT DATA PREPARATION
  // =========================================================

  function getExportData(
    clean
  ) {

    return clone(data)
      .map(item => {

        if (!clean) {
          return item;
        }

        const copy =
          clone(item);

        delete copy.review;

        return copy;
      });
  }

  // =========================================================
  // EXPORT JSON
  // =========================================================

  function exportJSON(
    clean
  ) {

    const output =
      getExportData(
        clean
      );

    download(

      clean
        ? `${DATASET_ID}-clean.json`
        : `${DATASET_ID}-reviewed.json`,

      JSON.stringify(
        output,
        null,
        2
      ),

      "application/json;charset=utf-8"
    );
  }

  // =========================================================
  // EXPORT JS
  // =========================================================

  function exportJS(
    clean
  ) {

    const output =
      getExportData(
        clean
      );

    const source =
      `const egyptianGraniteMaterials = ${JSON.stringify(
        output,
        null,
        2
      )};\n\n` +

      `window.egyptianGraniteMaterials = egyptianGraniteMaterials;\n`;

    download(

      clean
        ? `${DATASET_ID}-clean.js`
        : `${DATASET_ID}-reviewed.js`,

      source,

      "text/javascript;charset=utf-8"
    );
  }

  // =========================================================
  // NORMALIZE SLUG
  // =========================================================

  function normalizeSlug(
    slug
  ) {

    if (
      slug === null ||
      slug === undefined
    ) {
      return "";
    }

    return String(slug)
      .trim()
      .toLowerCase();
  }

  // =========================================================
  // EXTRACT ARRAY FROM JS
  // =========================================================

  function extractArrayFromJS(
    source
  ) {

    if (
      typeof source !== "string" ||
      !source.trim()
    ) {

      throw new Error(
        "ملف JavaScript فارغ."
      );
    }

    // =======================================================
    // SUPPORT:
    //
    // const egyptianGraniteMaterials = [...]
    //
    // export const egyptianGraniteMaterials = [...]
    //
    // let egyptianGraniteMaterials = [...]
    //
    // var egyptianGraniteMaterials = [...]
    // =======================================================

    const declarationRegex =
      /(?:export\s+)?(?:const|let|var)\s+egyptianGraniteMaterials\s*=\s*/;

    const declarationMatch =
      source.match(
        declarationRegex
      );

    if (!declarationMatch) {

      throw new Error(
        "لم يتم العثور على egyptianGraniteMaterials داخل ملف JS."
      );
    }

    const start =
      declarationMatch.index +
      declarationMatch[0].length;

    // =======================================================
    // FIND [
    // =======================================================

    let arrayStart =
      -1;

    for (
      let i = start;
      i < source.length;
      i++
    ) {

      if (
        source[i] === "["
      ) {

        arrayStart =
          i;

        break;
      }

      if (
        !/\s/.test(
          source[i]
        )
      ) {
        break;
      }
    }

    if (
      arrayStart === -1
    ) {

      throw new Error(
        "لم يتم العثور على Array داخل ملف JS."
      );
    }

    // =======================================================
    // BALANCED ARRAY PARSER
    // =======================================================

    let depth = 0;

    let quote = null;

    let escaped = false;

    let arrayEnd =
      -1;

    for (
      let i = arrayStart;
      i < source.length;
      i++
    ) {

      const char =
        source[i];

      // -----------------------------------------------------
      // INSIDE STRING
      // -----------------------------------------------------

      if (quote) {

        if (escaped) {

          escaped =
            false;

          continue;
        }

        if (
          char === "\\"
        ) {

          escaped =
            true;

          continue;
        }

        if (
          char === quote
        ) {

          quote =
            null;
        }

        continue;
      }

      // -----------------------------------------------------
      // START STRING
      // -----------------------------------------------------

      if (
        char === '"' ||
        char === "'" ||
        char === "`"
      ) {

        quote =
          char;

        continue;
      }

      // -----------------------------------------------------
      // ARRAY START
      // -----------------------------------------------------

      if (
        char === "["
      ) {

        depth++;

        continue;
      }

      // -----------------------------------------------------
      // ARRAY END
      // -----------------------------------------------------

      if (
        char === "]"
      ) {

        depth--;

        if (
          depth === 0
        ) {

          arrayEnd =
            i;

          break;
        }
      }
    }

    if (
      arrayEnd === -1
    ) {

      throw new Error(
        "لم يتم إغلاق Array بشكل صحيح."
      );
    }

    // =======================================================
    // ARRAY SOURCE
    // =======================================================

    const arraySource =
      source.slice(
        arrayStart,
        arrayEnd + 1
      );

    // =======================================================
    // PARSE
    // =======================================================

    let parsed;

    try {

      const factory =
        new Function(
          `"use strict"; return (${arraySource});`
        );

      parsed =
        factory();

    } catch (error) {

      console.error(
        "JS dataset parsing error:",
        error
      );

      throw new Error(
        "تعذر قراءة Array الموجودة داخل ملف JS. تأكد أن صيغة البيانات صحيحة."
      );
    }

    if (
      !Array.isArray(parsed)
    ) {

      throw new Error(
        "البيانات المستخرجة من ملف JS ليست Array."
      );
    }

    return parsed;
  }

  // =========================================================
  // MERGE IMPORTED ITEMS
  // =========================================================

  function mergeImportedItems(
    parsed,
    sourceName = "ملف البيانات"
  ) {

    if (
      !Array.isArray(parsed)
    ) {

      throw new Error(
        "البيانات المستوردة يجب أن تكون Array."
      );
    }

    if (
      !parsed.length
    ) {

      showMessage(
        "⚠️ الملف فارغ."
      );

      return;
    }

    // =======================================================
    // VALID ITEMS
    // =======================================================

    const validItems =
      parsed.filter(
        item =>
          item &&
          typeof item === "object" &&
          !Array.isArray(item)
      );

    if (
      !validItems.length
    ) {

      throw new Error(
        "لم يتم العثور على عناصر صحيحة داخل الملف."
      );
    }

    // =======================================================
    // CONFIRM
    // =======================================================

    const confirmed =
      confirm(

        `${sourceName}\n\n` +

        `عدد العناصر في الملف: ${validItems.length}\n` +

        `عدد العناصر الحالية: ${data.length}\n\n` +

        `سيتم إضافة العناصر الجديدة فقط.\n` +

        `البيانات الحالية لن يتم حذفها.\n` +

        `العناصر التي لها نفس slug لن تتكرر.\n` +

        `أي Reviews أو تعديلات موجودة ستظل كما هي.\n\n` +

        `هل تريد المتابعة؟`
      );

    if (!confirmed) {

      showMessage(
        "تم إلغاء الاستيراد."
      );

      return;
    }

    // =======================================================
    // EXISTING SLUGS
    // =======================================================

    const existingSlugs =
      new Set();

    data.forEach(
      item => {

        if (
          item &&
          typeof item === "object"
        ) {

          const slug =
            normalizeSlug(
              item.slug
            );

          if (slug) {

            existingSlugs.add(
              slug
            );
          }
        }
      }
    );

    // =======================================================
    // MERGE COUNTERS
    // =======================================================

    let added = 0;

    let duplicates = 0;

    let withoutSlug = 0;

    let invalid = 0;

    // =======================================================
    // IMPORTED SLUGS
    // =======================================================

    const importedSlugs =
      new Set();

    // =======================================================
    // MERGE
    // =======================================================

    validItems.forEach(
      newItem => {

        const item =
          clone(newItem);

        const slug =
          normalizeSlug(
            item.slug
          );

        // ---------------------------------------------------
        // WITHOUT SLUG
        // ---------------------------------------------------

        if (!slug) {

          data.push(item);

          added++;

          withoutSlug++;

          return;
        }

        // ---------------------------------------------------
        // DUPLICATE EXISTING
        // ---------------------------------------------------

        if (
          existingSlugs.has(
            slug
          )
        ) {

          duplicates++;

          return;
        }

        // ---------------------------------------------------
        // DUPLICATE INSIDE IMPORT
        // ---------------------------------------------------

        if (
          importedSlugs.has(
            slug
          )
        ) {

          duplicates++;

          return;
        }

        // ---------------------------------------------------
        // ADD
        // ---------------------------------------------------

        data.push(item);

        existingSlugs.add(
          slug
        );

        importedSlugs.add(
          slug
        );

        added++;
      }
    );

    // =======================================================
    // INVALID
    // =======================================================

    invalid =
      parsed.length -
      validItems.length;

    // =======================================================
    // SAVE
    // =======================================================

    saveState();

    updateStats();

    // =======================================================
    // RESET POSITION
    // =======================================================

    currentIndex =
      0;

    rebuildVisible();

    // =======================================================
    // RESULT
    // =======================================================

    let message =
      `✓ تم الاستيراد والدمج بنجاح.\n` +

      `تمت إضافة: ${added}\n` +

      `المكرر: ${duplicates}`;

    if (
      withoutSlug > 0
    ) {

      message +=
        `\nبدون slug: ${withoutSlug}`;
    }

    if (
      invalid > 0
    ) {

      message +=
        `\nعناصر غير صالحة: ${invalid}`;
    }

    showMessage(
      message
    );
  }

  // =========================================================
  // PARSE IMPORT FILE
  // =========================================================

  function parseImportFile(
    file,
    source
  ) {

    const fileName =
      String(
        file?.name || ""
      ).toLowerCase();

    const extension =
      fileName.includes(".")
        ? fileName
            .split(".")
            .pop()
        : "";

    // =======================================================
    // JSON
    // =======================================================

    if (
      extension === "json" ||
      file?.type ===
        "application/json"
    ) {

      try {

        const parsed =
          JSON.parse(
            source
          );

        if (
          !Array.isArray(
            parsed
          )
        ) {

          throw new Error(
            "ملف JSON يجب أن يحتوي Array."
          );
        }

        return parsed;

      } catch (error) {

        if (
          error.message ===
          "ملف JSON يجب أن يحتوي Array."
        ) {

          throw error;
        }

        throw new Error(
          "ملف JSON غير صحيح."
        );
      }
    }

    // =======================================================
    // JS
    // =======================================================

    if (
      extension === "js" ||
      file?.type ===
        "text/javascript" ||
      file?.type ===
        "application/javascript"
    ) {

      return extractArrayFromJS(
        source
      );
    }

    // =======================================================
    // AUTO JSON
    // =======================================================

    const trimmed =
      source.trim();

    if (
      trimmed.startsWith("[")
    ) {

      try {

        const parsed =
          JSON.parse(
            trimmed
          );

        if (
          Array.isArray(parsed)
        ) {

          return parsed;
        }

      } catch {
        // Continue
      }
    }

    // =======================================================
    // AUTO JS
    // =======================================================

    if (
      trimmed.includes(
        "egyptianGraniteMaterials"
      )
    ) {

      return extractArrayFromJS(
        source
      );
    }

    throw new Error(
      "نوع الملف غير مدعوم. استخدم JSON أو JavaScript."
    );
  }

  // =========================================================
  // IMPORT MANUAL FILE
  // =========================================================

  function importData(
    file
  ) {

    const reader =
      new FileReader();

    reader.onload =
      () => {

        try {

          const source =
            String(
              reader.result || ""
            );

          const parsed =
            parseImportFile(
              file,
              source
            );

          const fileName =
            String(
              file?.name ||
              "الملف"
            );

          mergeImportedItems(
            parsed,
            `ملف: ${fileName}`
          );

        } catch (error) {

          console.error(
            "Import error:",
            error
          );

          alert(
            `فشل الاستيراد:\n\n${error.message}`
          );
        }
      };

    reader.onerror =
      () => {

        alert(
          "تعذر قراءة الملف."
        );
      };

    reader.readAsText(
      file,
      "utf-8"
    );
  }

  // =========================================================
  // IMPORT FROM DATA FOLDER
  // =========================================================

  async function importFromDataFolder() {

    try {

      showMessage(
        "جاري قراءة البيانات من مجلد data..."
      );

      // =====================================================
      // CHECK PAGE PROTOCOL
      // =====================================================

      if (
        location.protocol ===
        "file:"
      ) {

        throw new Error(

          "الصفحة تعمل حاليًا من file://.\n\n" +

          "زر الاستيراد التلقائي من مجلد data يحتاج تشغيل المشروع عبر Web Server.\n\n" +

          "مثال:\n" +

          "http://localhost:3000\n\n" +

          "وليس:\n" +

          "file:///C:/..."
        );
      }

      // =====================================================
      // FETCH
      // =====================================================

      const response =
        await fetch(
          DATA_FOLDER_FILE,
          {
            cache: "no-store"
          }
        );

      // =====================================================
      // HTTP ERROR
      // =====================================================

      if (
        !response.ok
      ) {

        throw new Error(

          `HTTP ${response.status}\n\n` +

          `تعذر الوصول إلى الملف:\n` +

          `${DATA_FOLDER_FILE}\n\n` +

          `تأكد أن الملف موجود داخل مجلد data بجوار الصفحة.`
        );
      }

      // =====================================================
      // READ TEXT
      // =====================================================

      const source =
        await response.text();

      if (
        !source.trim()
      ) {

        throw new Error(
          "ملف البيانات فارغ."
        );
      }

      // =====================================================
      // PARSE
      // =====================================================

      const importedItems =
        extractArrayFromJS(
          source
        );

      if (
        !Array.isArray(
          importedItems
        )
      ) {

        throw new Error(
          "ملف البيانات لا يحتوي على Array صحيحة."
        );
      }

      // =====================================================
      // MERGE
      // =====================================================

      mergeImportedItems(
        importedItems,
        "Egyptian Granite Materials"
      );

    } catch (error) {

      console.error(
        "Import from data folder error:",
        error
      );

      alert(
        "تعذر استيراد البيانات.\n\n" +
        error.message
      );
    }
  }

  // =========================================================
  // RESET DATA
  // =========================================================

  function resetData() {

    const confirmed =
      confirm(

        "⚠️ إعادة ضبط البيانات\n\n" +

        "سيتم حذف جميع البيانات المحفوظة لهذه الأداة، " +

        "بما في ذلك:\n\n" +

        "• التعديلات\n" +

        "• المراجعات\n" +

        "• الملاحظات\n" +

        "• البيانات التي تم استيرادها\n\n" +

        "وسيتم الرجوع إلى Dataset الأصلي.\n\n" +

        "هذه العملية لا يمكن التراجع عنها.\n\n" +

        "هل أنت متأكد من المتابعة؟"
      );

    if (!confirmed) {

      showMessage(
        "تم إلغاء إعادة الضبط."
      );

      return;
    }

    try {

      localStorage.removeItem(
        STORAGE_KEY
      );

      showMessage(
        "✓ تم حذف البيانات المحفوظة. جارٍ إعادة تحميل الصفحة..."
      );

      setTimeout(
        () => {
          location.reload();
        },
        500
      );

    } catch (error) {

      console.error(
        "Reset error:",
        error
      );

      alert(
        "تعذر حذف البيانات المحفوظة."
      );
    }
  }

  // =========================================================
  // BUTTONS
  // =========================================================

  $("correctBtn").onclick =
    () =>
      setReview(
        "CORRECT"
      );

  $("incorrectBtn").onclick =
    () =>
      setReview(
        "INCORRECT"
      );

  $("clearReviewBtn").onclick =
    clearReview;

  $("doneBtn").onclick =
    done;

  $("prevBtn").onclick =
    () =>
      move(-1);

  $("nextBtn").onclick =
    () =>
      move(1);

  $("firstBtn").onclick =
    () =>
      goToVisibleNumber(1);

  $("lastBtn").onclick =
    () =>
      goToVisibleNumber(
        visibleIndexes.length
      );

  $("gotoBtn").onclick =
    () =>
      goToVisibleNumber(
        $("gotoInput").value
      );

  // =========================================================
  // RESET BUTTON
  // =========================================================

  $("resetDataBtn").onclick =
    resetData;

  // =========================================================
  // GOTO ENTER
  // =========================================================

  $("gotoInput").addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        goToVisibleNumber(
          event.target.value
        );
      }
    }
  );

  // =========================================================
  // SEARCH
  // =========================================================

  $("searchInput").addEventListener(
    "input",
    rebuildVisible
  );

  // =========================================================
  // FILTER
  // =========================================================

  $("filterSelect").addEventListener(
    "change",
    rebuildVisible
  );

  // =========================================================
  // EXPORT JSON
  // =========================================================

  $("exportReviewedBtn").onclick =
    () => {

      exportJSON(false);

      showMessage(
        "✓ تم تحميل ملف JSON المراجع."
      );
    };

  $("exportCleanBtn").onclick =
    () => {

      exportJSON(true);

      showMessage(
        "✓ تم تحميل ملف JSON النظيف."
      );
    };

  // =========================================================
  // IMPORT BUTTON
  // =========================================================
  //
  // IMPORTANT:
  //
  // The button now reads automatically from:
  //
  // ./data/egyptianGraniteMaterials.js
  //
  // It does NOT open the file picker.
  //
  // =========================================================

  $("importBtn").onclick =
    importFromDataFolder;

  // =========================================================
  // OPTIONAL MANUAL FILE INPUT
  // =========================================================
  //
  // This remains available if you want to enable
  // manual file importing later.
  //
  // =========================================================

  const fileInput =
    $("fileInput");

  if (fileInput) {

    fileInput.addEventListener(
      "change",
      event => {

        if (
          event.target.files &&
          event.target.files[0]
        ) {

          importData(
            event.target.files[0]
          );
        }

        event.target.value =
          "";
      }
    );
  }

  // =========================================================
  // KEYBOARD SHORTCUTS
  // =========================================================

  document.addEventListener(
    "keydown",
    event => {

      const tag =
        document.activeElement
          ?.tagName;

      const typing =
        [
          "INPUT",
          "TEXTAREA",
          "SELECT"
        ].includes(tag);

      if (
        !typing &&
        event.key === "ArrowRight"
      ) {

        move(1);
      }

      if (
        !typing &&
        event.key === "ArrowLeft"
      ) {

        move(-1);
      }

      if (
        !typing &&
        event.key.toLowerCase() ===
          "s"
      ) {

        done();
      }
    }
  );

  // =========================================================
  // INITIALIZE
  // =========================================================

  loadState();

  rebuildVisible();

})();
