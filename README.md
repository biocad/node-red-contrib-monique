# node-red-contrib-monique
MoniQue node for Node-RED

Узел для работы с системой MoniQue из Node-RED

## Установка

1) установить node-red-contrib-zeromq через "Manage palette" или npm
```bash
npm i node-red-contrib-zeromq
```

2) установить node-red-contrib-monique через npm
```bash
npm i biocad/node-red-contrib-monique
```

## Примеры

Перед запуском примеров необходимо локально запустить scheduler – "одно место" (документация [mq](https://github.com/biocad/mq))

Примеры доступны через меню: Import — Examples — monique

#### Пример "Radio"

Пример отправки и получения сообщения через "одно место"

#### Пример "MQTT"

Пример публикации сообщений системы мониторинга лабораторного оборудования полученных по MQTT.

Пример поля data:
```json
{
   "id": 123456,
   "t1": 1.23,
   "d1": 0,
  "equ": "Polair ШХФ-0.7",
  "loc": "ЛГТ"
}
```

Описание возможных полей сообщения в data:
  * `id` – идентификатор устройства;
  * `equ` – наименование оборудование;
  * `loc` – местоположение оборудования;
  * `t1 ... t9` – температура (°С);
  * `h1 ... h9` – влажность (%);
  * `c1 ... c9` – уровень CO2 (%);
  * `d1 ... d9` – статус двери (0/1);
  * `p1 ... p9` – давление (Pa);
