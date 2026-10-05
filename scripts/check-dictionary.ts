import 'dotenv/config';
import assert from 'node:assert/strict';
import { Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { DictionaryModule } from '../src/modules/dictionary/dictionary.module';

@Module({ imports: [PrismaModule, DictionaryModule] })
class DictionarySmokeModule {}

async function main() {
  const app = await NestFactory.create(DictionarySmokeModule, {
    logger: false,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().build(),
  );
  SwaggerModule.setup('api/docs', app, document);
  try {
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const response = await fetch(`${base}/api/dictionary/suggest?q=he`);
    assert.equal(response.status, 200);
    const rows = (await response.json()) as Array<Record<string, unknown>>;
    assert(rows.length > 0 && rows.length <= 20);
    assert(
      rows.every((row) => String(row.term).toLowerCase().startsWith('he')),
    );
    assert(rows.every((row) => Object.hasOwn(row, 'example')));
    assert(rows.every((row) => !String(row.term).includes(' ')));
    const lookup = await fetch(`${base}/api/dictionary/lookup?q=hello`);
    assert.equal(lookup.status, 200);
    const hello = (await lookup.json()) as {
      term: string;
      phonetic: string;
      audioUrl: string;
      audioSourceUrl: string;
    };
    assert.equal(hello.term.toLowerCase(), 'hello');
    assert(hello.phonetic);
    assert(hello.audioUrl.startsWith('https://commons.wikimedia.org/'));
    assert(hello.audioSourceUrl.includes('/File:'));
    const absent = await fetch(
      `${base}/api/dictionary/lookup?q=zzzz_not_a_real_word_123`,
    );
    assert.equal(await absent.text(), ''); // Nest sends an empty body for null without the app response interceptor.
    const empty = await fetch(`${base}/api/dictionary/suggest?q=%20`);
    assert.equal(empty.status, 400);
    const missing = await fetch(`${base}/api/dictionary/suggest`);
    assert.equal(missing.status, 400);
    const wildcard = await fetch(`${base}/api/dictionary/suggest?q=%25`);
    const literalRows = (await wildcard.json()) as Array<{ term: string }>;
    assert(literalRows.every((row) => row.term.startsWith('%')));
    const docs = await fetch(`${base}/api/docs-json`);
    assert.equal(docs.status, 200);
    const schema = document.components?.schemas?.DictionaryEntryResponse;
    assert(schema && 'properties' in schema && schema.properties?.example);
    const prisma = app.get(PrismaService);
    const samples = await prisma.dictionaryEntry.findMany({
      where: { term: { in: ['run', 'set', 'hello', 'book'] } },
    });
    assert.equal(samples.find((row) => row.term === 'run')?.meaning, 'Chạy.');
    assert.equal(
      samples.find((row) => row.term === 'set')?.meaning,
      'Để, đặt.',
    );
    assert(
      samples
        .filter((row) => ['run', 'set'].includes(row.term))
        .every((row) => row.partOfSpeech === 'V'),
    );
    assert.equal(
      await prisma.dictionaryEntry.count({
        where: {
          OR: [
            { meaning: { contains: 'Wiktionary' } },
            { meaning: { startsWith: 'Dạng viết' } },
          ],
        },
      }),
      0,
    );
    console.log(
      JSON.stringify(
        {
          count: await prisma.dictionaryEntry.count(),
          samples,
          suggestions: rows.slice(0, 2),
        },
        null,
        2,
      ),
    );
    console.log(
      'PASS: HTTP suggestions, example, validation, literal prefix, Swagger, overrides, junk filter.',
    );
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
