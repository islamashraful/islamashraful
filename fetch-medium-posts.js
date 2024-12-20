/**
 * This script updates a README.md file with the latest blog posts from a Medium profile.
 * It fetches the posts, checks for specific markers in the README.md file, and inserts
 * the posts along with a timestamp.
 */

const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

const NUM_OF_BLOGS_TO_SHOW = 50;

async function fetchMediumPosts() {
  const mediumUrl = "https://imasharaful.medium.com/";
  const { data: html } = await axios.get(mediumUrl);
  const $ = cheerio.load(html);

  const blogs = [];
  $('div[role="link"]').each((_, element) => {
    const title = $(element).find("h2").text().trim();
    const subtitle = $(element).find("h3").text().trim();
    const link = $(element).attr("data-href");
    blogs.push({
      title,
      subtitle,
      link: `https://imasharaful.medium.com${link}`,
    });
  });

  return blogs;
}

async function updateReadme() {
  const readmePath = "README.md";

  if (!fs.existsSync(readmePath)) {
    console.log("README.md file does not exist. Exiting...");
    return;
  }

  const readmeContent = fs.readFileSync(readmePath, "utf8");

  const startMarker = "<!-- START_FETCHED_MEDIUM_POSTS -->";
  const endMarker = "<!-- END_FETCHED_MEDIUM_POSTS -->";

  if (
    !readmeContent.includes(startMarker) ||
    !readmeContent.includes(endMarker)
  ) {
    console.log("Markers not found in README.md. Exiting...");
    return;
  }

  const posts = (await fetchMediumPosts()).slice(0, NUM_OF_BLOGS_TO_SHOW);
  if (!posts.length) {
    console.log("Could not fetch posts from medium. Exiting...");
    return;
  }

  const postLinks = posts
    .map(
      (post, index) =>
        `${index + 1}. **[${post.title}](${post.link})**  \n   _${
          post.subtitle
        }_`
    )
    .join("\n\n");

  const lastUpdated = new Intl.DateTimeFormat("en-DE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());

  const lastUpdatedHTML = `<p align="right"><code>[Last updated: ${lastUpdated} (Europe/Berlin)]</code></p>`;

  const newSection = `${startMarker}\n\n${postLinks}\n\n${lastUpdatedHTML}\n\n${endMarker}`;

  const updatedReadme = readmeContent.replace(
    new RegExp(`${startMarker}[\\s\\S]*${endMarker}`),
    newSection
  );

  fs.writeFileSync(readmePath, updatedReadme);
  console.log(`README.md updated with Medium posts: ${lastUpdated}`);
}

updateReadme();
