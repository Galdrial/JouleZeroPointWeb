import request from 'supertest';
import app from '../app';

describe('Rulebook API — Public Sync', () => {
    test('Should return the public rulebook payload', async () => {
        const res = await request(app).get('/api/v1/rules');

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
            version: '6.0',
            title: 'JOULE: ZERO POINT – Regolamento Ufficiale',
        });
        expect(res.body).toHaveProperty('sections');
        expect(Array.isArray(res.body.sections)).toBe(true);
        expect(res.body.sections.length).toBeGreaterThan(0);
        expect(res.body).not.toHaveProperty('ai');
        expect(res.body.introduction.download.href).toBe('/Regolamento_Joule_Zero_Point_v6.pdf');
    });
});
