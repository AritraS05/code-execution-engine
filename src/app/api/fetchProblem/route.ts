import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

function extractFromSite(url: string, $: cheerio.CheerioAPI) {
  if (url.includes('leetcode.com')) {
    const title = $("div[data-cy='question-title']").text() || $("h1").first().text();
    const description = $(".content__u3I1.question-content__JfgR").html() || "";
    const $desc = cheerio.load(description);
    const preTags = $desc('pre').toArray().map(el => $desc(el).text());
    return {
      title,
      description: $desc.text(),
      sampleInput: preTags[0] || "",
      sampleOutput: preTags[1] || "",
    };
  }
  if (url.includes('codeforces.com')) {
    return {
      title: $('div.title').first().text().trim(),
      description: $('div.problem-statement').first().text().trim(),
      sampleInput: $('div.input > pre').first().text().trim(),
      sampleOutput: $('div.output > pre').first().text().trim(),
    };
  }
  if (url.includes('codechef.com')) {
    const title = $('h1').first().text().trim();
    const description = $('div[class*="problem-statement"]').first().text().trim();
    const preTags = $('pre').toArray().map(el => $(el).text());
    return {
      title,
      description,
      sampleInput: preTags[0] || "",
      sampleOutput: preTags[1] || "",
    };
  }
  if (url.includes('atcoder.jp')) {
    const title = $('.problem-title').first().text().trim();
    const descSection = $('#task-statement').html() || "";
    const $desc = cheerio.load(descSection);
    const sampleInput = $desc('pre').first().text();
    const sampleOutput = $desc('pre').eq(1).text();
    return {
      title,
      description: $desc.text(),
      sampleInput,
      sampleOutput,
    };
  }
  if (url.includes('geeksforgeeks.org')) {
    const title = $('h1.heading').first().text() || $('h1').first().text().trim();
    const description = $('div[class*="problem-description"]').text() || $('div.content').first().text();
    const preTags = $('pre').toArray().map(el => $(el).text());
    return {
      title,
      description,
      sampleInput: preTags[0] || "",
      sampleOutput: preTags[1] || "",
    };
  }
  return { title: "", description: "", sampleInput: "", sampleOutput: "" };
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);

  const details = extractFromSite(url, $);

  return NextResponse.json(details);
}
