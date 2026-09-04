(() => {
  const DATASET_ID = "granite-part-4";
  const DATASET_NAME = "Egyptian Granite — Part 4";
  const STORAGE_KEY = `material-review-tool:v2:${DATASET_ID}`;

  let data = Array.isArray(window.egyptianGraniteMaterials)
    ? window.egyptianGraniteMaterials
    : [];

  let currentIndex = 0;
  let visibleIndexes = [];

  const $ = id => document.getElementById(id);

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  // =========================================================
  // LOCAL STORAGE
  // =========================================================

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) return;

      const saved = JSON.parse(raw);

      if (!Array.isArray(saved.data)) return;

      data = saved.data;

    } catch (e) {
      console.warn("Could not load saved state", e);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 2,
          savedAt: new Date().toISOString(),
          data
        })
      );
    } catch (e) {
      console.error("Could not save state", e);

      showMessage(
        "تعذر الحفظ في localStorage. قد تكون مساحة التخزين ممتلئة."
      );
    }
  }

  // =========================================================
  // REVIEW STATUS
  // =========================================================

  function reviewedStatus(item) {
    return item?.review?.status || null;
  }

  // =========================================================
  // STATS
  // =========================================================

  function updateStats() {
    const total = data.length;

    const reviewed = data.filter(
      x => reviewedStatus(x)
    ).length;

    const correct = data.filter(
      x => reviewedStatus(x) === "CORRECT"
    ).length;

    const incorrect = data.filter(
      x => reviewedStatus(x) === "INCORRECT"
    ).length;

    $("totalStat").textContent = total;
    $("reviewedStat").textContent = reviewed;
    $("correctStat").textContent = correct;
    $("incorrectStat").textContent = incorrect;
    $("remainingStat").textContent = total - reviewed;
  }

  // =========================================================
  // SEARCH
  // =========================================================

  function matchesSearch(item, q) {
    if (!q) return true;

    return JSON.stringify(item)
      .toLowerCase()
      .includes(q.toLowerCase());
  }

  // =========================================================
  // VISIBLE ITEMS
  // =========================================================

  function rebuildVisible() {
    const q = $("searchInput").value.trim();
    const filter = $("filterSelect").value;

    visibleIndexes = data
      .map((item, i) => ({
        item,
        i
      }))
      .filter(({ item }) => {
        const status = reviewedStatus(item);

        const filterOk =
          filter === "ALL" ||
          (filter === "UNREVIEWED" && !status) ||
          status === filter;

        return filterOk && matchesSearch(item, q);
      })
      .map(x => x.i);

    if (!visibleIndexes.length) {
      renderEmpty();
      return;
    }

    if (!visibleIndexes.includes(currentIndex)) {
      currentIndex = visibleIndexes[0];
    }

    renderItem();
  }

  // =========================================================
  // EMPTY STATE
  // =========================================================

  function renderEmpty() {
    $("itemPosition").textContent = "0 / 0";

    $("itemStatus").textContent = "لا توجد نتائج";

    $("itemStatus").className = "badge neutral";

    $("datasetName").textContent = DATASET_NAME;

    $("itemEditor").innerHTML = `
      <div class="empty">
        لا توجد عناصر مطابقة للبحث أو الفلتر.
      </div>
    `;

    $("notesInput").value = "";
  }

  // =========================================================
  // RENDER VALUE
  // =========================================================

  function renderValue(key, value) {
    const wrapper = document.createElement("div");

    wrapper.className = "editor-value";

    // =======================================================
    // ARRAY
    // =======================================================

    if (Array.isArray(value)) {
      const list = document.createElement("div");

      list.className = "array-list";

      value.forEach((v, idx) => {
        const row = document.createElement("div");

        row.className = "array-item";

        // ---------------------------------------------------
        // INPUT
        // ---------------------------------------------------

        const input = document.createElement("input");

        input.value =
          typeof v === "string"
            ? v
            : JSON.stringify(v);

        input.dataset.path = key;
        input.dataset.index = idx;
        input.dataset.kind = "array";

        // ---------------------------------------------------
        // SAVE ARRAY VALUE WHILE TYPING
        // ---------------------------------------------------

        input.addEventListener("input", () => {
          const item = data[currentIndex];

          const index = Number(
            input.dataset.index
          );

          if (!item) return;

          if (!Array.isArray(item[key])) {
            return;
          }

          item[key][index] = input.value;

          saveState();
        });

        // ---------------------------------------------------
        // DELETE ARRAY ITEM
        // ---------------------------------------------------

        const del = document.createElement("button");

        del.className = "secondary";

        del.textContent = "حذف";

        del.type = "button";

        del.onclick = () => {
          const item = data[currentIndex];

          if (!item) return;

          if (!Array.isArray(item[key])) {
            return;
          }

          item[key].splice(idx, 1);

          saveState();

          renderItem();
        };

        row.append(
          input,
          del
        );

        list.appendChild(row);
      });

      // =====================================================
      // ADD ARRAY ITEM
      // =====================================================

      const add = document.createElement("button");

      add.className = "secondary";

      add.type = "button";

      add.textContent = "+ إضافة";

      add.onclick = () => {
        const item = data[currentIndex];

        if (!item) return;

        if (!Array.isArray(item[key])) {
          item[key] = [];
        }

        item[key].push("");

        saveState();

        renderItem();

        // ---------------------------------------------------
        // Focus newly created input
        // ---------------------------------------------------

        setTimeout(() => {
          const inputs =
            $("itemEditor").querySelectorAll(
              `input[data-path="${key}"]`
            );

          const lastInput =
            inputs[inputs.length - 1];

          if (lastInput) {
            lastInput.focus();
          }
        }, 0);
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
        document.createElement("textarea");

      textarea.value = JSON.stringify(
        value,
        null,
        2
      );

      textarea.dataset.path = key;

      textarea.dataset.kind = "json";

      textarea.addEventListener(
        "change",
        () => {
          try {
            data[currentIndex][key] =
              JSON.parse(textarea.value);

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

      wrapper.appendChild(textarea);

      return wrapper;
    }

    // =======================================================
    // SCALAR
    // =======================================================

    const input =
      document.createElement("input");

    input.value = value ?? "";

    input.dataset.path = key;

    input.dataset.kind = "scalar";

    input.addEventListener(
      "change",
      () => {
        data[currentIndex][key] =
          input.value;

        saveState();

        updateStats();
      }
    );

    wrapper.appendChild(input);

    return wrapper;
  }

  // =========================================================
  // RENDER CURRENT ITEM
  // =========================================================

  function renderItem() {
    const item = data[currentIndex];

    if (!item) {
      renderEmpty();
      return;
    }

    const pos =
      visibleIndexes.indexOf(
        currentIndex
      ) + 1;

    $("itemPosition").textContent =
      `${pos} / ${visibleIndexes.length}`;

    $("datasetName").textContent =
      DATASET_NAME;

    // =======================================================
    // STATUS
    // =======================================================

    const status =
      reviewedStatus(item);

    $("itemStatus").textContent =
      status === "CORRECT"
        ? "Correct"
        : status === "INCORRECT"
          ? "Incorrect"
          : "غير مراجع";

    $("itemStatus").className =
      `badge ${
        status === "CORRECT"
          ? "correct"
          : status === "INCORRECT"
            ? "incorrect"
            : "neutral"
      }`;

    // =======================================================
    // NOTES
    // =======================================================

    $("notesInput").value =
      item.review?.notes || "";

    // =======================================================
    // EDITOR
    // =======================================================

    const editor =
      $("itemEditor");

    editor.innerHTML = "";

    Object.entries(item).forEach(
      ([key, value]) => {

        // Do not render review as normal field
        if (key === "review") {
          return;
        }

        const row =
          document.createElement("div");

        row.className =
          "editor-row";

        const keyEl =
          document.createElement("div");

        keyEl.className =
          "editor-key";

        keyEl.textContent = key;

        row.append(
          keyEl,
          renderValue(
            key,
            value
          )
        );

        editor.appendChild(row);
      }
    );

    updateStats();
  }

  // =========================================================
  // MESSAGE
  // =========================================================

  function showMessage(msg) {
    $("saveMessage").textContent =
      msg;

    clearTimeout(
      showMessage.timer
    );

    showMessage.timer =
      setTimeout(() => {
        $("saveMessage").textContent =
          "";
      }, 3000);
  }

  // =========================================================
  // SET REVIEW
  // =========================================================

  function setReview(status) {
    const item =
      data[currentIndex];

    if (!item) return;

    item.review = {
      reviewed: true,

      status,

      notes:
        $("notesInput").value.trim(),

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

    delete data[currentIndex].review;

    saveState();

    renderItem();
  }

  // =========================================================
  // DONE
  // =========================================================

  function done() {
    const item = data[currentIndex];

    if (!item) return;

    // =======================================================
    // 1. SAVE ALL CURRENT EDITOR CHANGES
    // =======================================================

    const editor = $("itemEditor");

    if (editor) {

      // -----------------------------------------------------
      // Scalar inputs
      // -----------------------------------------------------

      const scalarInputs =
        editor.querySelectorAll(
          'input[data-kind="scalar"]'
        );

      scalarInputs.forEach(input => {
        const key =
          input.dataset.path;

        if (!key) return;

        item[key] =
          input.value;
      });

      // -----------------------------------------------------
      // Array inputs
      // -----------------------------------------------------

      const arrayInputs =
        editor.querySelectorAll(
          'input[data-kind="array"]'
        );

      arrayInputs.forEach(input => {
        const key =
          input.dataset.path;

        const index =
          Number(input.dataset.index);

        if (
          !key ||
          !Number.isInteger(index)
        ) {
          return;
        }

        if (
          !Array.isArray(item[key])
        ) {
          return;
        }

        item[key][index] =
          input.value;
      });

      // -----------------------------------------------------
      // JSON textareas
      // -----------------------------------------------------

      const jsonTextareas =
        editor.querySelectorAll(
          'textarea[data-kind="json"]'
        );

      for (const textarea of jsonTextareas) {
        const key =
          textarea.dataset.path;

        if (!key) continue;

        try {
          item[key] =
            JSON.parse(
              textarea.value
            );

        } catch {
          showMessage(
            `القيمة الخاصة بـ "${key}" تحتوي JSON غير صحيح.`
          );

          textarea.focus();

          return;
        }
      }
    }

    // =======================================================
    // 2. CHECK REVIEW STATUS
    // =======================================================

    const status =
      reviewedStatus(item);

    if (!status) {
      showMessage(
        "اختر Correct أو Incorrect أولًا."
      );

      return;
    }

    // =======================================================
    // 3. SAVE REVIEW + NOTES
    // =======================================================

    item.review = {
      reviewed: true,

      status,

      notes:
        $("notesInput").value.trim(),

      reviewedAt:
        new Date().toISOString()
    };

    // =======================================================
    // 4. SAVE EVERYTHING
    // =======================================================

    saveState();

    updateStats();

    showMessage(
      "✓ تم حفظ التعديلات والمراجعة."
    );

    // =======================================================
    // 5. MOVE TO NEXT VISIBLE ITEM
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
        visibleIndexes[nextPosition];

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
    if (!visibleIndexes.length) {
      return;
    }

    let p =
      visibleIndexes.indexOf(
        currentIndex
      );

    p = Math.max(
      0,
      Math.min(
        visibleIndexes.length - 1,
        p + delta
      )
    );

    currentIndex =
      visibleIndexes[p];

    renderItem();
  }

  // =========================================================
  // GO TO NUMBER
  // =========================================================

  function goToVisibleNumber(n) {
    if (!visibleIndexes.length) {
      return;
    }

    const number =
      Number(n);

    if (!Number.isFinite(number)) {
      return;
    }

    const p =
      Math.max(
        1,
        Math.min(
          visibleIndexes.length,
          number
        )
      ) - 1;

    currentIndex =
      visibleIndexes[p];

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
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download = filename;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  // =========================================================
  // EXPORT DATA PREPARATION
  // =========================================================

  function getExportData(clean) {
    return clone(data).map(item => {

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

  function exportJSON(clean) {
    const output =
      getExportData(clean);

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

  function exportJS(clean) {
    const output =
      getExportData(clean);

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

  function normalizeSlug(slug) {
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
  // EXTRACT ARRAY FROM JS DATASET
  // =========================================================
  //
  // Supported format:
  //
  // const egyptianGraniteMaterials = [
  //   {...},
  //   {...}
  // ];
  //
  // window.egyptianGraniteMaterials =
  //   egyptianGraniteMaterials;
  //
  // =========================================================

  function extractArrayFromJS(source) {

    if (
      typeof source !== "string" ||
      !source.trim()
    ) {
      throw new Error(
        "ملف JavaScript فارغ."
      );
    }

    // -------------------------------------------------------
    // Find dataset declaration
    // -------------------------------------------------------

    const declarationRegex =
      /(?:const|let|var)\s+egyptianGraniteMaterials\s*=\s*/;

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

    // -------------------------------------------------------
    // Find opening [
    // -------------------------------------------------------

    let arrayStart = -1;

    for (
      let i = start;
      i < source.length;
      i++
    ) {
      if (
        source[i] === "["
      ) {
        arrayStart = i;
        break;
      }

      if (
        !/\s/.test(source[i])
      ) {
        break;
      }
    }

    if (arrayStart === -1) {
      throw new Error(
        "لم يتم العثور على Array داخل ملف JS."
      );
    }

    // -------------------------------------------------------
    // Balanced bracket parser
    // -------------------------------------------------------

    let depth = 0;

    let quote = null;

    let escaped = false;

    let arrayEnd = -1;

    for (
      let i = arrayStart;
      i < source.length;
      i++
    ) {
      const char =
        source[i];

      // -----------------------------------------------------
      // Inside string
      // -----------------------------------------------------

      if (quote) {

        if (escaped) {
          escaped = false;
          continue;
        }

        if (
          char === "\\"
        ) {
          escaped = true;
          continue;
        }

        if (
          char === quote
        ) {
          quote = null;
        }

        continue;
      }

      // -----------------------------------------------------
      // Start string
      // -----------------------------------------------------

      if (
        char === '"' ||
        char === "'" ||
        char === "`"
      ) {
        quote = char;
        continue;
      }

      // -----------------------------------------------------
      // Array start
      // -----------------------------------------------------

      if (
        char === "["
      ) {
        depth++;
        continue;
      }

      // -----------------------------------------------------
      // Array end
      // -----------------------------------------------------

      if (
        char === "]"
      ) {
        depth--;

        if (depth === 0) {
          arrayEnd = i;
          break;
        }
      }
    }

    if (arrayEnd === -1) {
      throw new Error(
        "لم يتم إغلاق Array بشكل صحيح."
      );
    }

    // -------------------------------------------------------
    // Get only Array expression
    // -------------------------------------------------------

    const arraySource =
      source.slice(
        arrayStart,
        arrayEnd + 1
      );

    // -------------------------------------------------------
    // Convert JS Array literal to actual data
    // -------------------------------------------------------
    //
    // This supports the dataset format generated
    // by this application.
    //
    // -------------------------------------------------------

    let parsed;

    try {
      const factory =
        new Function(
          `"use strict"; return (${arraySource});`
        );

      parsed = factory();

    } catch (e) {

      console.error(
        "JS dataset parsing error:",
        e
      );

      throw new Error(
        "تعذر قراءة Array الموجودة داخل ملف JS."
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
  // PARSE IMPORT FILE
  // =========================================================

  function parseImportFile(file, source) {

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

    // -------------------------------------------------------
    // JSON
    // -------------------------------------------------------

    if (
      extension === "json" ||
      file.type === "application/json"
    ) {
      try {

        const parsed =
          JSON.parse(source);

        if (
          !Array.isArray(parsed)
        ) {
          throw new Error(
            "ملف JSON يجب أن يحتوي Array."
          );
        }

        return parsed;

      } catch (e) {

        if (
          e.message ===
          "ملف JSON يجب أن يحتوي Array."
        ) {
          throw e;
        }

        throw new Error(
          "ملف JSON غير صحيح."
        );
      }
    }

    // -------------------------------------------------------
    // JavaScript
    // -------------------------------------------------------

    if (
      extension === "js" ||
      file.type === "text/javascript" ||
      file.type === "application/javascript"
    ) {
      return extractArrayFromJS(
        source
      );
    }

    // -------------------------------------------------------
    // Auto detect
    // -------------------------------------------------------

    const trimmed =
      source.trim();

    if (
      trimmed.startsWith("[")
    ) {
      try {

        const parsed =
          JSON.parse(trimmed);

        if (
          Array.isArray(parsed)
        ) {
          return parsed;
        }

      } catch {
        // Continue and try JS
      }
    }

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
  // IMPORT DATA - JSON + JS
  // =========================================================

  function importData(file) {

    const reader =
      new FileReader();

    reader.onload = () => {

      try {

        const source =
          String(
            reader.result || ""
          );

        // ---------------------------------------------------
        // Parse file
        // ---------------------------------------------------

        const parsed =
          parseImportFile(
            file,
            source
          );

        // ---------------------------------------------------
        // Validate
        // ---------------------------------------------------

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

        // ---------------------------------------------------
        // Count valid objects
        // ---------------------------------------------------

        const validItems =
          parsed.filter(item =>
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

        // ---------------------------------------------------
        // Detect file type for message
        // ---------------------------------------------------

        const fileName =
          String(
            file?.name || ""
          );

        const fileType =
          fileName
            .toLowerCase()
            .endsWith(".js")
            ? "JavaScript"
            : "JSON";

        // ---------------------------------------------------
        // Confirm merge
        // ---------------------------------------------------

        const confirmed =
          confirm(
            `ملف ${fileType}\n\n` +

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

        // ===================================================
        // BUILD EXISTING SLUG SET
        // ===================================================

        const existingSlugs =
          new Set();

        data.forEach(item => {

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
        });

        // ===================================================
        // MERGE
        // ===================================================

        let added = 0;

        let duplicates = 0;

        let withoutSlug = 0;

        let invalid = 0;

        // ---------------------------------------------------
        // Track duplicates inside imported file too
        // ---------------------------------------------------

        const importedSlugs =
          new Set();

        validItems.forEach(
          newItem => {

            const item =
              clone(newItem);

            const slug =
              normalizeSlug(
                item.slug
              );

            // -----------------------------------------------
            // Item without slug
            // -----------------------------------------------

            if (!slug) {

              data.push(item);

              added++;

              withoutSlug++;

              return;
            }

            // -----------------------------------------------
            // Duplicate against existing data
            // -----------------------------------------------

            if (
              existingSlugs.has(slug)
            ) {

              duplicates++;

              return;
            }

            // -----------------------------------------------
            // Duplicate inside same imported file
            // -----------------------------------------------

            if (
              importedSlugs.has(slug)
            ) {

              duplicates++;

              return;
            }

            // -----------------------------------------------
            // Add new item
            // -----------------------------------------------

            data.push(item);

            existingSlugs.add(slug);

            importedSlugs.add(slug);

            added++;
          }
        );

        // ---------------------------------------------------
        // Count invalid records
        // ---------------------------------------------------

        invalid =
          parsed.length -
          validItems.length;

        // ===================================================
        // SAVE
        // ===================================================

        saveState();

        updateStats();

        // ===================================================
        // RESET CURRENT POSITION
        // ===================================================

        currentIndex = 0;

        rebuildVisible();

        // ===================================================
        // RESULT MESSAGE
        // ===================================================

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

      } catch (e) {

        console.error(
          "Import error:",
          e
        );

        alert(
          `فشل الاستيراد:\n\n${e.message}`
        );
      }
    };

    reader.onerror = () => {

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
  // GOTO ENTER
  // =========================================================

  $("gotoInput").addEventListener(
    "keydown",
    e => {

      if (e.key === "Enter") {

        goToVisibleNumber(
          e.target.value
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
  // EXPORT BUTTONS
  // =========================================================

  /*
    Each button downloads ONE file only.

    This prevents the browser from showing:

    "This site attempted to download multiple files"
  */

  $("exportReviewedBtn").onclick = () => {

    exportJSON(false);

    showMessage(
      "✓ تم تحميل ملف JSON المراجع."
    );
  };

  $("exportCleanBtn").onclick = () => {

    exportJSON(true);

    showMessage(
      "✓ تم تحميل ملف JSON النظيف."
    );
  };

  // =========================================================
  // IMPORT
  // =========================================================

  $("importBtn").onclick =
    () =>
      $("fileInput").click();

  $("fileInput").addEventListener(
    "change",
    e => {

      if (
        e.target.files &&
        e.target.files[0]
      ) {

        importData(
          e.target.files[0]
        );
      }

      // Reset input so the same
      // file can be selected again
      e.target.value = "";
    }
  );

  // =========================================================
  // KEYBOARD SHORTCUTS
  // =========================================================

  document.addEventListener(
    "keydown",
    e => {

      const tag =
        document.activeElement?.tagName;

      const typing =
        [
          "INPUT",
          "TEXTAREA",
          "SELECT"
        ].includes(tag);

      if (
        !typing &&
        e.key === "ArrowRight"
      ) {
        move(1);
      }

      if (
        !typing &&
        e.key === "ArrowLeft"
      ) {
        move(-1);
      }

      if (
        !typing &&
        e.key.toLowerCase() === "s"
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
