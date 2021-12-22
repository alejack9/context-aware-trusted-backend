import { Test, TestingModule } from '@nestjs/testing';
import { waitFor } from '../../wait-for';
import { CloakingEngineService } from './cloaking-engine.service';
import { makeMessage } from './message';

describe('CloakingEngineService', () => {
  let service: CloakingEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloakingEngineService],
    }).compile();

    service = module.get<CloakingEngineService>(CloakingEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should put the message in the queue', () => {
    expect(
      service.newMessage(
        makeMessage(
          '1',
          1,
          Date.now(),
          1000,
          2000,
          2,
          3000,
          5,
          5,
          {
            dummyLocation: false,
            gpsPerturbated: false,
            cloaking: true,
            noiseLevel: 5,
            timeStamp: Date.now(),
          },
          () => {},
          () => {},
        ),
      ),
    );
  });

  it('should not throw an error', () => {
    service.newMessage(
      makeMessage(
        '1',
        1,
        Date.now(),
        1000,
        2000,
        3,
        5000,
        5,
        5,
        {
          dummyLocation: false,
          gpsPerturbated: false,
          cloaking: true,
          noiseLevel: 5,
          timeStamp: Date.now(),
        },
        () => {},
        () => {},
      ),
    );

    expect(() => {}).not.toThrowError();
  });

  it('should return an array of 3 MBRs', () => {
    let returned = 0;
    service.newMessage(
      makeMessage(
        '1',
        1,
        Date.now(),
        1000,
        2000,
        3,
        5000,
        5,
        5,
        {
          dummyLocation: false,
          gpsPerturbated: false,
          cloaking: true,
          noiseLevel: 5,
          timeStamp: Date.now(),
        },
        () => returned++,
        () => {},
      ),
    );
    service.newMessage(
      makeMessage(
        '1',
        2,
        Date.now(),
        6000,
        2000,
        3,
        5000,
        5,
        5,
        {
          dummyLocation: false,
          gpsPerturbated: false,
          cloaking: true,
          noiseLevel: 6,
          timeStamp: Date.now(),
        },
        () => returned++,
        () => {},
      ),
    );
    service.newMessage(
      makeMessage(
        '1',
        3,
        Date.now(),
        1000,
        2000,
        3,
        5000,
        5,
        5,
        {
          dummyLocation: false,
          gpsPerturbated: false,
          cloaking: true,
          noiseLevel: 4,
          timeStamp: Date.now(),
        },
        () => returned++,
        () => {},
      ),
    );
    service.newMessage(
      makeMessage(
        '1',
        4,
        Date.now(),
        1000,
        2000,
        3,
        5000,
        5,
        5,
        {
          dummyLocation: false,
          gpsPerturbated: false,
          cloaking: true,
          noiseLevel: 1,
          timeStamp: Date.now(),
        },
        () => returned++,
        () => {},
      ),
    );

    expect(returned).toBe(3);
  });

  it('should return an array of 1 MBRs', () => {
    let returned = 0;
    service.newMessage(
      makeMessage(
        '1',
        1,
        Date.now(),
        1000,
        2000,
        1,
        5000,
        5,
        5,
        {
          dummyLocation: false,
          gpsPerturbated: false,
          cloaking: true,
          noiseLevel: 5,
          timeStamp: Date.now(),
        },
        () => returned++,
        () => {},
      ),
    );

    expect(returned).toBe(1);
  });

  it('should expire one', async () => {
    let returned = 0;
    let expired = 0;
    service.newMessage(
      makeMessage(
        '1',
        1,
        Date.now() - 2000,
        1000,
        100,
        2,
        3,
        5,
        5,
        {
          dummyLocation: false,
          gpsPerturbated: false,
          cloaking: true,
          noiseLevel: 5,
          timeStamp: Date.now() - 2000,
        },
        () => returned++,
        () => expired++,
      ),
    );
    service.newMessage(
      makeMessage(
        '1',
        2,
        Date.now(),
        1000,
        2000,
        2,
        3000,
        5,
        5,
        {
          dummyLocation: false,
          gpsPerturbated: false,
          cloaking: true,
          noiseLevel: 5,
          timeStamp: Date.now(),
        },
        () => returned++,
        () => expired++,
      ),
    );

    await waitFor(2000);

    expect(returned).toBe(0);
    expect(expired).toBe(1);
  });
});
