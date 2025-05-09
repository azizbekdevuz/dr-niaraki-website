# Professor Website Update Guide

This guide will help you (Professor) update, add, edit, or delete any information about yourself on your website—including your bio, contact info, patents, publications, awards, and experience. No programming experience is needed. Just follow the steps below!

---

## 1. What You Need

- **A code editor:** [VS Code](https://code.visualstudio.com/) is recommended (free and easy to use).
- **Access to the project files:** Ask your developer if you don't have this.
- **Basic computer skills:** You only need to open, edit, and save text files.
- **Backup advice:** Before making changes, copy the file you want to edit and save it somewhere safe. This way, you can restore it if something goes wrong.

---

## 2. Where to Find Your Information

| Information Type      | File to Edit                                      |
|----------------------|---------------------------------------------------|
| Publications         | `src/datasets/pblcDataset.ts`                      |
| Patents              | `src/datasets/patents.ts`                          |
| Bio, Contact, Stats  | `src/datasets/dataAbout.ts`                        |
| Experience, Awards   | `src/components/index/aboutSection/dataComponents.tsx` |

---

## 3. How to Edit Your Information

### A. Publications
**File:** `src/datasets/pblcDataset.ts`

#### To Add a Publication
1. Open the file in your editor.
2. Find the list that looks like this:
   ```ts
   const publicationsData: Publication[] = [
     {
       id: 1,
       type: "journal",
       title: "...",
       authors: ["...", "..."],
       year: 2024,
       venue: "...",
       impact: "...",
       doi: "..."
     },
     // ... more publications
   ];
   ```
3. Copy an existing publication (from `{` to `},`), paste it below, and change the details. Make sure the `id` is unique (add 1 to the highest number).

#### To Edit a Publication
- Change the text inside the relevant entry (e.g., update the title, authors, year, etc.).

#### To Delete a Publication
- Remove the entire entry (from `{` to `},`).

#### Example
```ts
{
  id: 99,
  type: "journal",
  title: "My New Research Paper",
  authors: ["A. Sadeghi-Niaraki", "J. Smith"],
  year: 2025,
  venue: "Journal of Example",
  impact: "IF: 3.2",
  doi: "10.1234/example.2025.001"
},
```

---

### B. Patents
**File:** `src/datasets/patents.ts`

#### To Add a Patent
1. Open the file in your editor.
2. Find the list that looks like this:
   ```ts
   export const patents = [
     {
       id: 1,
       type: "US International",
       title: "...",
       number: "...",
       date: "...",
       inventors: ["...", "..."],
     },
     // ... more patents
   ];
   ```
3. Copy an existing patent entry, paste it below, and change the details. Make sure the `id` is unique.

#### To Edit a Patent
- Change the text inside the relevant entry (e.g., update the title, inventors, number, etc.).

#### To Delete a Patent
- Remove the entire entry (from `{` to `},`).

#### Example
```ts
{
  id: 43,
  type: "Korean",
  title: "New Patent Title",
  number: "10-9999999",
  date: "Jan 1, 2025",
  inventors: ["A. Sadeghi-Niaraki", "S. M. Choi"],
},
```

---

### C. Bio, Contact Info, Stats
**File:** `src/datasets/dataAbout.ts`

#### To Edit Bio or Contact Info
- Look for sections like `contactInfo` or `careerTimeline` at the top of the file. Change the text as needed.

#### Example
```ts
export const contactInfo: ContactInfo = {
  position: "Associate Professor",
  department: "Dept. of Computer Science & Engineering",
  center: "eXtended Reality (XR) Center",
  university: "Sejong University",
  address: "209- Gwangjin-gu, Gunja-dong, Neungdong-ro, Seoul, Republic of Korea",
  tel: "+82 2-3408-2981",
  fax: "+82 2-3408-4321",
  email: "a.sadeghi@sejong.ac.kr",
};
```

#### To Edit Research Stats, Areas, or Projects
- Find the relevant array (e.g., `researchStats`, `researchAreas`, `majorProjects`) and edit/add/delete entries as above.

---

### D. Experience, Awards
**File:** `src/components/index/aboutSection/dataComponents.tsx`

#### To Edit Experience
- Find the `experiences` array and edit/add/delete entries.

#### Example
```ts
export const experiences: Experience[] = [
  {
    position: "Associate Professor",
    institution: "Sejong University, South Korea",
    duration: "2017 - Present",
    details: "Leading research in Geo-AI and XR technologies",
    achievements: [
      "Published 30+ research papers",
      "Supervised 15+ graduate students",
      "Secured major research grants",
    ],
    projects: [
      "Smart City Development",
      "AI-Enhanced GIS",
      "XR Navigation Systems",
    ],
  },
  // ... more experience
];
```

#### To Edit Awards
- Find the `awards` array and edit/add/delete entries.

#### Example
```ts
export const awards: Awards[] = [
  {
    award: "Best Research Paper Award",
    organization: "GIS International Conference",
    year: "2020",
    details: "Recognition for innovative work in Geo-AI integration",
    impact: "Cited by 100+ researchers worldwide",
    color: "from-blue-500 to-purple-500",
  },
  // ... more awards
];
```

---

## 4. Saving and Checking Your Changes

1. **Save the file** after editing (File > Save, or Ctrl+S).
2. **Preview the website:**
   - If you have a local setup, run `npm run dev` in the terminal and open the site in your browser.
   - If not, send the updated file(s) to your developer to update the website for you.

---

## 5. If Something Goes Wrong

- **Restore your backup:** Copy your backup file back to the original location.
- **Ask your developer for help:** Send them the file and explain what happened.
- **Don't panic:** As long as you have a backup, nothing is lost!

---

## 6. FAQ (Frequently Asked Questions)

**Q: What if I make a typo or break the file?**
A: Restore your backup, or ask your developer to help fix it.

**Q: How do I know which `id` to use?**
A: Use a number that is not already used in the list. Usually, add 1 to the highest number.

**Q: Can I add images?**
A: Yes! Put your image in `public/assets/images/` and reference it in the data if needed (ask your developer for help if unsure).

**Q: What if I want to add a new type of information?**
A: Ask your developer to add support for it in the code.

---

## 7. Summary Table

| What You Want to Change | File to Edit                                      |
|------------------------|---------------------------------------------------|
| Publications           | `src/datasets/pblcDataset.ts`                      |
| Patents                | `src/datasets/patents.ts`                          |
| Bio/Contact/Stats      | `src/datasets/dataAbout.ts`                        |
| Experience/Awards      | `src/components/index/aboutSection/dataComponents.tsx` |

---

**With this guide, you can confidently update your website's content! If you ever feel unsure, ask your developer for help.** 